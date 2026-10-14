import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { routing } from "@/i18n/routing";
import { localeOf, pathnameWithoutLocale } from "@/lib/utils/locale-path";
import { localizedPathMatcher, pathMatcher } from "@/lib/utils/route-matcher";
import {
  MAIN_DOMAIN_ONLY_ROUTES,
  PROTECTED_ROUTES,
  SUBDOMAIN_REDIRECT_TO_HOME_ROUTES,
  SUPER_ADMIN_ROUTES,
} from "@/lib/route-policy";

const isProtectedRoute = localizedPathMatcher(PROTECTED_ROUTES);

const isSuperAdminRoute = localizedPathMatcher(SUPER_ADMIN_ROUTES);

const isMainDomainOnlyRoute = localizedPathMatcher(MAIN_DOMAIN_ONLY_ROUTES);

// Routes that should redirect to the dealership home on subdomains
const isSubdomainRedirectToHomeRoute = localizedPathMatcher(
  SUBDOMAIN_REDIRECT_TO_HOME_ROUTES
);

// API routes are not localized — they carry no locale prefix and must bypass
// the intl middleware entirely, or every fetch gains a redirect hop.
const isApiRoute = pathMatcher(["/api(.*)", "/trpc(.*)"]);

// Crawler files are per host, not per language, and live at the root. The
// intl middleware would redirect /sitemap.xml to /en/sitemap.xml, which does
// not exist. They still go through Clerk's handler, which is what sets the
// sanitized x-subdomain header they read to tell a storefront from the
// marketplace.
const isCrawlerFile = pathMatcher(["/sitemap.xml", "/robots.txt"]);

// Discovery documents (OAuth for MCP clients, among others) live at the root,
// per host. Localized, they were redirected to /en/.well-known/… and answered
// with an HTML page where a client expects a plain 404.
const isWellKnown = pathMatcher(["/.well-known/(.*)"]);

const isPublicApiRoute = pathMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  // Background jobs, delivered by QStash; each request proves itself with a
  // signature (app/api/jobs/[name]/route.ts), never a session.
  "/api/jobs(.*)",
]);

const intlMiddleware = createIntlMiddleware(routing);

/** Where Clerk's Frontend API is proxied (see the clerkMiddleware options below). */
const CLERK_PROXY_PATH = "/__clerk";
// No locale, never intl.
const isClerkProxy = pathMatcher([CLERK_PROXY_PATH, `${CLERK_PROXY_PATH}/(.*)`]);

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

const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = new URL(req.url);

  // Parse subdomain
  const subdomain = getSubdomain(req);

  const requestHeaders = new Headers(req.headers);

  // A client can send any header it likes. Strip our internal ones before we
  // trust anything downstream — otherwise forwarding them turns
  // x-organization-slug into a client-controlled tenant selector. The
  // impersonation ones are no longer set at all: a support session is the
  // database row its cookie names, verified on the server
  // (lib/services/impersonation/active.ts), never something a request asserts.
  requestHeaders.delete("x-organization-slug");
  requestHeaders.delete("x-subdomain");
  requestHeaders.delete("x-impersonation-active");
  requestHeaders.delete("x-impersonated-org");
  requestHeaders.delete("x-impersonated-user");
  requestHeaders.delete("x-impersonation-session");

  if (subdomain) {
    requestHeaders.set("x-organization-slug", subdomain);
    requestHeaders.set("x-subdomain", subdomain);
  }

  // Create response, forwarding the sanitized request headers downstream.
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Skip auth for public API routes (webhooks, cron)
  if (isPublicApiRoute(url.pathname)) {
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
  if (subdomain && isMainDomainOnlyRoute(url.pathname)) {
    // Becoming a dealer — the pitch and onboarding — continues on the main
    // domain; anything else returns to this storefront's home.
    const path = pathnameWithoutLocale(url.pathname);
    if (path.startsWith("/onboarding") || path.startsWith("/for-dealers")) {
      const mainDomainUrl = ROOT_DOMAIN === "localhost"
        ? `http://localhost:${url.port || "3000"}${url.pathname}${url.search}`
        : `https://${ROOT_DOMAIN}${url.pathname}${url.search}`;
      return NextResponse.redirect(mainDomainUrl);
    }
    return NextResponse.redirect(new URL(localeHome, req.url));
  }

  // Redirect dealership-listing routes to home on subdomains
  // (on a subdomain, the user is already on a specific dealership)
  if (subdomain && isSubdomainRedirectToHomeRoute(url.pathname)) {
    return NextResponse.redirect(new URL(localeHome, req.url));
  }

  // Admin routes (platform admin): require auth and ADMIN role (checked in layout)
  if (isSuperAdminRoute(url.pathname)) {
    if (!userId) {
      return redirectToLocalizedSignIn();
    }
    // Role check happens in the super-admin layout
    return response;
  }

  // Protected routes: require auth
  if (!userId && isProtectedRoute(url.pathname)) {
    return redirectToLocalizedSignIn();
  }

  // For org admin routes on subdomains, ensure user has access (checked in layout)
  if (subdomain && isProtectedRoute(url.pathname) && !userId) {
    return redirectToLocalizedSignIn();
  }

  return response;
},
// Clerk's Frontend API through this site at /__clerk — required for a
// production instance on a vercel.app domain, which cannot carry Clerk's DNS
// records. Only where NEXT_PUBLIC_CLERK_PROXY_URL is set (production); the
// browser side reads the same variable. Clerk handles the path before the
// handler above runs, with the keys from the environment.
{ frontendApiProxy: { enabled: Boolean(process.env.NEXT_PUBLIC_CLERK_PROXY_URL), path: CLERK_PROXY_PATH } });

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const { pathname } = req.nextUrl;
  if (isApiRoute(pathname) || isCrawlerFile(pathname) || isWellKnown(pathname) || isClerkProxy(pathname)) {
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
    // Clerk's proxied Frontend API serves .js files, which the first pattern skips.
    "/__clerk/(.*)",
  ],
};
