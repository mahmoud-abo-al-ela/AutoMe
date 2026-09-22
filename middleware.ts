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
import {
  MAIN_DOMAIN_ONLY_ROUTES,
  PROTECTED_ROUTES,
  SUBDOMAIN_REDIRECT_TO_HOME_ROUTES,
  SUPER_ADMIN_ROUTES,
} from "@/lib/route-policy";

const isProtectedRoute = createRouteMatcher(localized(PROTECTED_ROUTES));

const isSuperAdminRoute = createRouteMatcher(localized(SUPER_ADMIN_ROUTES));

const isMainDomainOnlyRoute = createRouteMatcher(
  localized(MAIN_DOMAIN_ONLY_ROUTES)
);

// Routes that should redirect to the dealership home on subdomains
const isSubdomainRedirectToHomeRoute = createRouteMatcher(
  localized(SUBDOMAIN_REDIRECT_TO_HOME_ROUTES)
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

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);

  // Parse subdomain
  const subdomain = getSubdomain(req);

  // Check for impersonation context
  const impersonation = getImpersonationContext(req);

  // Determine effective organization slug
  const effectiveOrgSlug = impersonation?.organizationSlug || subdomain;
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

  const locale = localeOf(url.pathname);
  const localeHome = `/${locale}`;

  const redirectToLocalizedSignIn = () => {
    const target = new URL(`/${locale}/sign-in`, req.url);
    target.searchParams.set("redirect_url", url.pathname + url.search);
    return NextResponse.redirect(target);
  };

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
      return redirectToLocalizedSignIn();
    }
    // Role check happens in the super-admin layout
    return response;
  }

  // Protected routes: require auth
  if (!userId && isProtectedRoute(req)) {
    return redirectToLocalizedSignIn();
  }

  // For org admin routes on subdomains, ensure user has access (checked in layout)
  if (subdomain && isProtectedRoute(req) && !userId) {
    return redirectToLocalizedSignIn();
  }

  return response;
});

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  if (isApiRoute(req)) {
    return clerk(req, event);
  }

  const intlResponse = intlMiddleware(req);

  // A redirect (or anything else non-pass-through) is final.
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  const response = await clerk(req, event);

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
