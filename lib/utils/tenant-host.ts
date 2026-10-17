export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "autome.com";

/** `nile-motors.autome.com` — a host name, so render it `dir="ltr"`. */
export function tenantHost(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`;
}

export function mainSiteUrl(path: string, locale: string): string {
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL || `https://${ROOT_DOMAIN}`);
  return `${app.origin}/${locale}${path}`;
}

export function storefrontUrl(slug: string, locale: string): string {
  const app = new URL(process.env.NEXT_PUBLIC_APP_URL || `https://${ROOT_DOMAIN}`);
  const port = app.port ? `:${app.port}` : "";
  return `${app.protocol}//${tenantHost(slug)}${port}/${locale}`;
}
