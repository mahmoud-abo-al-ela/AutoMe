import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/saved-cars(.*)",
  "/reservations(.*)",
]);

const isSuperAdminRoute = createRouteMatcher(["/super-admin(.*)"]);

const isMainDomainOnlyRoute = createRouteMatcher([
  "/pricing(.*)",
  "/signup-org(.*)",
  "/super-admin(.*)",
  "/onboarding(.*)",
]);

// Routes that should redirect to the dealership home on subdomains
const isSubdomainRedirectToHomeRoute = createRouteMatcher([
  "/dealerships",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

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

const aj = arcjet({
  // Asserted to keep the current runtime. Worth noting that this is the one
  // guard in the request path with no fail-closed check: if ARCJET_KEY is unset
  // in production, shield and bot detection are configured with undefined
  // rather than rejecting, the same shape as the CRON_SECRET fail-open that
  // Phase 0 closed. Left alone here because making middleware throw on a
  // missing key would take the whole site down rather than one endpoint.
  key: process.env.ARCJET_KEY!,
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

  // Block main-domain-only routes on subdomains
  if (subdomain && isMainDomainOnlyRoute(req)) {
    // For onboarding, redirect to the main domain's onboarding page
    if (url.pathname.startsWith("/onboarding")) {
      const mainDomainUrl = ROOT_DOMAIN === "localhost"
        ? `http://localhost:${url.port || "3000"}${url.pathname}${url.search}`
        : `https://${ROOT_DOMAIN}${url.pathname}${url.search}`;
      return NextResponse.redirect(mainDomainUrl);
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect dealership-listing routes to home on subdomains
  // (on a subdomain, the user is already on a specific dealership)
  if (subdomain && isSubdomainRedirectToHomeRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
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

// Chain middlewares - ArcJet runs first, then Clerk
export default createMiddleware(aj, clerk);

export const config = {
  matcher: [
    // Skip Next.js internals, Sentry tunnel, and all static files, unless found in search params
    "/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
