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
