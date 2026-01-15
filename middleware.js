import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ============ ROUTE MATCHERS ============

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/saved-cars(.*)",
  "/reservations(.*)",
]);

const isSuperAdminRoute = createRouteMatcher([
  "/super-admin(.*)",
]);

const isMainDomainOnlyRoute = createRouteMatcher([
  "/pricing(.*)",
  "/signup-org(.*)",
  "/super-admin(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

// ============ SUBDOMAIN PARSING ============

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

function getSubdomain(request) {
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

// ============ IMPERSONATION DETECTION ============

function getImpersonationContext(request) {
  const impersonatedOrg = request.cookies.get("x-impersonated-org")?.value;
  const impersonatedUser = request.cookies.get("x-impersonated-user")?.value;
  const impersonationSessionId = request.cookies.get("x-impersonation-session")?.value;

  if (impersonatedOrg && impersonatedUser && impersonationSessionId) {
    return {
      organizationSlug: impersonatedOrg,
      userId: impersonatedUser,
      sessionId: impersonationSessionId,
    };
  }

  return null;
}

// ============ ARCJET CONFIGURATION ============

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),
  ],
});

// ============ CLERK MIDDLEWARE WITH SUBDOMAIN SUPPORT ============

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);
  
  // Parse subdomain
  const subdomain = getSubdomain(req);
  
  // Check for impersonation context
  const impersonation = getImpersonationContext(req);
  
  // Determine effective organization slug
  const effectiveOrgSlug = impersonation?.organizationSlug || subdomain;

  // Create response with custom headers
  const response = NextResponse.next();

  // Set organization context headers for downstream use
  if (effectiveOrgSlug) {
    response.headers.set("x-organization-slug", effectiveOrgSlug);
  }
  
  if (subdomain) {
    response.headers.set("x-subdomain", subdomain);
  }

  // Set impersonation headers if active
  if (impersonation) {
    response.headers.set("x-impersonation-active", "true");
    response.headers.set("x-impersonated-org", impersonation.organizationSlug);
    response.headers.set("x-impersonated-user", impersonation.userId);
    response.headers.set("x-impersonation-session", impersonation.sessionId);
  }

  // Skip auth for public API routes (webhooks, cron)
  if (isPublicApiRoute(req)) {
    return response;
  }

  // Block main-domain-only routes on subdomains
  if (subdomain && isMainDomainOnlyRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Super admin routes: require auth and SUPER_ADMIN role (checked in layout)
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
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
