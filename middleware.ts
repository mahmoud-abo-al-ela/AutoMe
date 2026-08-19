import arcjet, { detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { routing } from "@/i18n/routing";
import {
  localized,
  localeOf,
  pathnameWithoutLocale,
} from "@/lib/utils/locale-path";

const isProtectedRoute = createRouteMatcher(
  localized(["/admin(.*)", "/saved-cars(.*)", "/reservations(.*)"])
);

const isSuperAdminRoute = createRouteMatcher(localized(["/super-admin(.*)"]));

const isMainDomainOnlyRoute = createRouteMatcher(
  localized([
    "/pricing(.*)",
    "/signup-org(.*)",
    "/super-admin(.*)",
    "/onboarding(.*)",
  ])
);

// Routes that should redirect to the dealership home on subdomains
const isSubdomainRedirectToHomeRoute = createRouteMatcher(
  localized(["/dealerships"])
);

// API routes are not localized — they carry no locale prefix and must bypass
// the intl middleware entirely, or every fetch gains a redirect hop.
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

const intlMiddleware = createIntlMiddleware(routing);

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

function getSubdomain(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0]; // Remove port

  // Handle localhost development with .localhost TLD
  // e.g., autome-cairo.localhost:3000 -> autome-cairo
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "");
    if (subdomain && subdomain !== "autome" && subdomain !== "www") {
      return subdomain;
    }
    return null;
  }

  // Production: extract subdomain from hostname
  // Expected: {subdomain}.autome.com
  if (ROOT_DOMAIN !== "localhost" && hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
    if (subdomain && subdomain !== "www" && subdomain !== hostname) {
      return subdomain;
    }
  }

  return null;
}

function getImpersonationContext(request: NextRequest) {
  const impersonatedOrg = request.cookies.get("x-impersonated-org")?.value;
  const impersonatedUser = request.cookies.get("x-impersonated-user")?.value;
  const impersonationSessionId = request.cookies.get(
    "x-impersonation-session",
  )?.value;

  if (impersonatedOrg && impersonatedUser && impersonationSessionId) {
    return {
      organizationSlug: impersonatedOrg,
      userId: impersonatedUser,
      sessionId: impersonationSessionId,
    };
  }

  return null;
}

// Use DRY_RUN in development to avoid blocking browser requests locally;
// LIVE mode is used in production for full protection.
const arcjetMode =
  process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN";

const ARCJET_KEY = process.env.ARCJET_KEY;

// Arcjet is only enforced in production. In development the rules run in
// DRY_RUN anyway, so an absent key is not a security gap there.
const arcjetRequired = process.env.NODE_ENV === "production";

const aj = arcjet({
  key: ARCJET_KEY ?? "",
  rules: [
    shield({
      mode: arcjetMode,
    }),
    detectBot({
      mode: arcjetMode,
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});

function serviceUnavailable() {
  return new NextResponse("Service Unavailable", {
    status: 503,
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Shield + bot detection, failing **closed**.
 *
 * Previously this was `createMiddleware(aj, clerk)`, which allows the request
 * through whenever Arcjet cannot reach a verdict — and `key` was a bare
 * non-null assertion, so an unset ARCJET_KEY in production silently configured
 * both rules with `undefined` and disabled them outright. Either way the site
 * served traffic with no shield and nothing in the logs to say so.
 *
 * Now: a missing key in production, or an errored decision, rejects with 503.
 * Denials reject with 429 for rate limits and 403 otherwise.
 */
async function arcjetGuard(req: NextRequest): Promise<NextResponse | null> {
  if (!ARCJET_KEY) {
    if (arcjetRequired) {
      console.error("ARCJET_KEY is not configured; rejecting request");
      return serviceUnavailable();
    }
    return null;
  }

  let decision;
  try {
    decision = await aj.protect(req);
  } catch (error) {
    console.error("Arcjet protect threw; rejecting request", error);
    return arcjetRequired ? serviceUnavailable() : null;
  }

  if (decision.isErrored()) {
    console.error("Arcjet returned an errored decision", decision.reason);
    return arcjetRequired ? serviceUnavailable() : null;
  }

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "cache-control": "no-store" },
      });
    }
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "cache-control": "no-store" },
    });
  }

  return null;
}

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);

  // Parse subdomain
  const subdomain = getSubdomain(req);

  // Check for impersonation context
  const impersonation = getImpersonationContext(req);

  // Determine effective organization slug
  const effectiveOrgSlug = impersonation?.organizationSlug || subdomain;

  // Forward tenant context on the *request* headers so server components and
  // actions can read it back via next/headers `headers()`. Setting them on the
  // response (the previous behaviour) never reached the app, so
  // getCurrentOrganization() always returned null and resolveTenantContext fell
  // back to an arbitrary membership.
  const requestHeaders = new Headers(req.headers);

  // A client can send any header it likes. Strip our internal ones before we
  // trust anything downstream — otherwise forwarding them turns
  // x-organization-slug into a client-controlled tenant selector.
  requestHeaders.delete("x-organization-slug");
  requestHeaders.delete("x-subdomain");
  requestHeaders.delete("x-impersonation-active");
  requestHeaders.delete("x-impersonated-org");
  requestHeaders.delete("x-impersonated-user");
  requestHeaders.delete("x-impersonation-session");

  if (effectiveOrgSlug) {
    requestHeaders.set("x-organization-slug", effectiveOrgSlug);
  }

  if (subdomain) {
    requestHeaders.set("x-subdomain", subdomain);
  }

  // Set impersonation headers if active
  if (impersonation) {
    requestHeaders.set("x-impersonation-active", "true");
    requestHeaders.set("x-impersonated-org", impersonation.organizationSlug);
    requestHeaders.set("x-impersonated-user", impersonation.userId);
    requestHeaders.set("x-impersonation-session", impersonation.sessionId);
  }

  // Create response, forwarding the sanitized request headers downstream.
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Skip auth for public API routes (webhooks, cron)
  if (isPublicApiRoute(req)) {
    return response;
  }

  // Redirects below must keep the locale the visitor is already reading, or
  // every subdomain bounce silently drops an Arabic user into English.
  const locale = localeOf(url.pathname);
  const localeHome = `/${locale}`;

  // Block main-domain-only routes on subdomains
  if (subdomain && isMainDomainOnlyRoute(req)) {
    // For onboarding, redirect to the main domain's onboarding page
    if (pathnameWithoutLocale(url.pathname).startsWith("/onboarding")) {
      const mainDomainUrl = ROOT_DOMAIN === "localhost"
        ? `http://localhost:${url.port || "3000"}${url.pathname}${url.search}`
        : `https://${ROOT_DOMAIN}${url.pathname}${url.search}`;
      return NextResponse.redirect(mainDomainUrl);
    }
    return NextResponse.redirect(new URL(localeHome, req.url));
  }

  // Redirect dealership-listing routes to home on subdomains
  // (on a subdomain, the user is already on a specific dealership)
  if (subdomain && isSubdomainRedirectToHomeRoute(req)) {
    return NextResponse.redirect(new URL(localeHome, req.url));
  }

  // Admin routes (platform admin): require auth and ADMIN role (checked in layout)
  if (isSuperAdminRoute(req)) {
    if (!userId) {
      const { redirectToSignIn } = await auth();
      return redirectToSignIn();
    }
    // Role check happens in the super-admin layout
    return response;
  }

  // Protected routes: require auth
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // For org admin routes on subdomains, ensure user has access (checked in layout)
  if (subdomain && isProtectedRoute(req) && !userId) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return response;
});

/**
 * Chain: Arcjet (fail-closed) → next-intl → Clerk.
 *
 * The order matters and each step is doing something the next one cannot undo:
 *
 * - Arcjet first, so a blocked request never reaches auth or locale resolution.
 * - next-intl second, but **only to catch its redirect**. On a path with no
 *   locale prefix it issues a 308 to the prefixed URL; returning that
 *   immediately is correct, and Clerk re-runs against the redirected request.
 * - Clerk last, because it owns the response: it is the step that forwards the
 *   sanitized tenant headers on the *request*, and rebuilding that response
 *   from intl's would drop them.
 *
 * API routes skip intl entirely — they carry no locale prefix, and running them
 * through it would add a redirect hop to every fetch and webhook.
 */
export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const blocked = await arcjetGuard(req);
  if (blocked) return blocked;

  if (isApiRoute(req)) {
    return clerk(req, event);
  }

  const intlResponse = intlMiddleware(req);

  // A redirect (or anything else non-pass-through) is final.
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  const response = await clerk(req, event);

  // Carry over anything intl set on a pass-through response — the NEXT_LOCALE
  // cookie in particular, which is what makes the choice stick across visits.
  if (response instanceof NextResponse) {
    for (const cookie of intlResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals, Sentry tunnel, and all static files, unless found in search params
    "/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
