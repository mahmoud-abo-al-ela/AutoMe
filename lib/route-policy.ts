/** Requires a signed-in user. Anonymous requests get Clerk's sign-in redirect. */
export const PROTECTED_ROUTES = [
  "/test-drive(.*)",
  "/wishlist(.*)",
  // Chat needs an account. Protected here so a signed-out visit comes back
  // after sign-in; the page's own redirect carried no return address.
  "/messages(.*)",
  // The org dashboard layout also redirects, but doing it here means an
  // anonymous request never reaches the layout — or the queries it runs.
  "/org(.*)",
];

/** Requires a signed-in user; the ADMIN role check happens in the layout. */
export const SUPER_ADMIN_ROUTES = ["/super-admin(.*)"];

/**
 * Not reachable on a dealership subdomain. The dealer pitch and onboarding
 * continue on the main domain; the rest return to the storefront's home.
 */
export const MAIN_DOMAIN_ONLY_ROUTES = [
  "/for-dealers(.*)",
  "/pricing(.*)",
  "/signup-org(.*)",
  "/super-admin(.*)",
  "/onboarding(.*)",
];

/** On a subdomain the visitor is already on one dealership, so the listing
 * page redirects to that dealership's home. */
export const SUBDOMAIN_REDIRECT_TO_HOME_ROUTES = ["/dealerships"];
