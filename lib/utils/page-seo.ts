import { headers } from "next/headers";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getCurrentOrganization } from "@/lib/getOrganization";
import {
  localeAlternates,
  mainOrigin,
  openGraphAlternateLocales,
  openGraphLocale,
} from "@/lib/utils/seo-meta";

async function subdomainOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("host");
  if (!h.get("x-subdomain") || !host) return null;

  const forwarded = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwarded || (host.split(":")[0].endsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function defaultShareImage(locale: Locale) {
  return { url: `${mainOrigin()}/${locale}/opengraph-image`, width: 1200, height: 630, alt: "AutoMe" };
}

/** The origin this request is being served on. */
export async function requestOrigin(): Promise<string> {
  return (await subdomainOrigin()) ?? mainOrigin();
}

export async function localizedPageMetadata(
  path: string,
  locale: Locale,
  copy: { title?: string; description?: string; tenantScoped?: boolean } = {}
) {
  const subdomain = copy.tenantScoped ? await subdomainOrigin() : null;
  const organization = subdomain ? await getCurrentOrganization() : null;
  const alternates = localeAlternates(
    path,
    locale,
    subdomain ?? mainOrigin()
  );

  return {
    ...(copy.title && { title: copy.title }),
    ...(copy.description && { description: copy.description }),
    alternates,
    openGraph: {
      ...(copy.title && { title: copy.title }),
      ...(copy.description && { description: copy.description }),
      type: "website",
      url: alternates.canonical,
      siteName: organization?.name ?? "AutoMe",
      locale: openGraphLocale(locale),
      alternateLocale: openGraphAlternateLocales(locale),
      images: [defaultShareImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      ...(copy.title && { title: copy.title }),
      ...(copy.description && { description: copy.description }),
    },
  } satisfies Metadata;
}
