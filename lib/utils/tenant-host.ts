/**
 * The domain dealership subdomains hang off, for display.
 *
 * Same fallback as the onboarding slug preview. Super-admin screens used to
 * print `{slug}.localhost` and `.autome.com` side by side, so the two disagreed
 * with each other and with production.
 */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "autome.com";

/** `nile-motors.autome.com` — a host name, so render it `dir="ltr"`. */
export function tenantHost(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`;
}

/**
 * A dealership's storefront, in a locale: `https://nile-motors.autome.com/ar`.
 * Protocol and port follow NEXT_PUBLIC_APP_URL, so on a dev machine it is
 * `http://nile-motors.localhost:3000/en`.
 */
export function storefrontUrl(slug: string, locale: string): string {
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL || `https://${ROOT_DOMAIN}`);
  const port = app.port ? `:${app.port}` : "";
  return `${app.protocol}//${tenantHost(slug)}${port}/${locale}`;
}
