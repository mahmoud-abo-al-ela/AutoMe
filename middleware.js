import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ============ ROUTE MATCHERS ============

const isProtectedRoute = createRouteMatcher([
  "/org/:slug/admin(.*)",
  "/saved-cars(.*)",
  "/reservations(.*)",
]);

const isSuperAdminRoute = createRouteMatcher(["/super-admin(.*)"]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

// ============ PATH-BASED ORGANIZATION PARSING ============

function getOrganizationSlugFromPath(request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);

  // Check if path starts with /org/[slug]
  if (pathSegments[0] === "org" && pathSegments[1]) {
    return pathSegments[1];
  }

  return null;
}

// ============ IMPERSONATION DETECTION ============

function getImpersonationContext(request) {
  const impersonatedOrg = request.cookies.get("x-impersonated-org")?.value;
  const impersonatedUser = request.cookies.get("x-impersonated-user")?.value;
  const impersonationSessionId = request.cookies.get(
    "x-impersonation-session"
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

// ============ ARCJET CONFIGURATION ============

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});

// ============ CLERK MIDDLEWARE WITH SUBDOMAIN SUPPORT ============

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);

  // Parse organization slug from path
  const orgSlugFromPath = getOrganizationSlugFromPath(req);

  // Check for impersonation context
  const impersonation = getImpersonationContext(req);

  // Determine effective organization slug (impersonation takes precedence)
  const effectiveOrgSlug = impersonation?.organizationSlug || orgSlugFromPath;

  // Create response with custom headers
  const response = NextResponse.next();

  // Set organization context headers for downstream use
  if (effectiveOrgSlug) {
    response.headers.set("x-organization-slug", effectiveOrgSlug);
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
