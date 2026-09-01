/**
 * Which URL families the middleware guards.
 *
 * These live outside `middleware.ts` so the test suite can assert against the
 * real lists without importing Arcjet and Clerk. That separation is the whole
 * point: the previous list named `/admin`, `/saved-cars` and `/reservations` —
 * three routes that do not exist in this app — while the actual signed-in
 * pages (`/test-drive`, `/wishlist`, `/org/[slug]`) were left open. A matcher
 * that matches nothing does not throw, so it went unnoticed until someone
 * opened /test-drive while logged out.
 *
 * The rule that follows: every pattern here must correspond to a directory
 * under `app/[locale]`, and adding a signed-in surface means adding it here.
 */

/** Requires a signed-in user. Anonymous requests get Clerk's sign-in redirect. */
export const PROTECTED_ROUTES = [
  "/test-drive(.*)",
  "/wishlist(.*)",
  // The org dashboard layout also redirects, but doing it here means an
  // anonymous request never reaches the layout — or the queries it runs.
  "/org(.*)",
];

/** Requires a signed-in user; the ADMIN role check happens in the layout. */
export const SUPER_ADMIN_ROUTES = ["/super-admin(.*)"];

/** Not reachable on a dealership subdomain; redirected to the main domain. */
export const MAIN_DOMAIN_ONLY_ROUTES = [
  "/pricing(.*)",
  "/signup-org(.*)",
  "/super-admin(.*)",
  "/onboarding(.*)",
];

/** On a subdomain the visitor is already on one dealership, so the listing
 * page redirects to that dealership's home. */
export const SUBDOMAIN_REDIRECT_TO_HOME_ROUTES = ["/dealerships"];
