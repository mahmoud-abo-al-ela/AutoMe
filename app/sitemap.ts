import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  findSitemapCars,
  findSitemapDealerships,
} from "@/lib/repositories/sitemap";
import { requestOrigin } from "@/lib/utils/page-seo";
import { sitemapEntries } from "@/lib/utils/seo-meta";

/**
 * One sitemap for the whole site, every URL once per locale with its hreflang
 * siblings attached.
 *
 * It lives at the app root, outside `[locale]`, because a sitemap is per host,
 * not per language: `/sitemap.xml` is where crawlers look, and the middleware
 * lets it through without a locale prefix. The one it replaces sat under
 * `[locale]/dealerships/`, so it was served at `/en/dealerships/sitemap.xml`,
 * listed unprefixed URLs that only redirect, and was referenced from nowhere.
 *
 * A page belongs here only once it is translated: listing an Arabic URL that
 * serves English as `ar-EG` is a false hreflang.
 */
const MARKETPLACE_PAGES = [
  "/",
  "/cars",
  "/dealerships",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
];

/**
 * A dealership subdomain lists only what it canonicalises onto itself — its
 * storefront and its stock (see `localizedPageMetadata`). Anything else on the
 * subdomain names the main domain as canonical, and a sitemap may only list
 * URLs on its own host.
 */
const STOREFRONT_PAGES = ["/", "/cars"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await requestOrigin();

  if ((await headers()).get("x-subdomain")) {
    return STOREFRONT_PAGES.flatMap((path) =>
      sitemapEntries(path, { changeFrequency: "daily" }, origin)
    );
  }

  const staticEntries = MARKETPLACE_PAGES.flatMap((path) =>
    sitemapEntries(path, {}, origin)
  );

  try {
    const [cars, dealerships] = await Promise.all([
      findSitemapCars(),
      findSitemapDealerships(),
    ]);

    return [
      ...staticEntries,
      ...dealerships.flatMap((d) =>
        sitemapEntries(
          `/dealerships/${d.slug}`,
          { lastModified: d.updatedAt },
          origin
        )
      ),
      ...cars.flatMap((c) =>
        sitemapEntries(`/cars/${c.id}`, { lastModified: c.updatedAt }, origin)
      ),
    ];
  } catch (error) {
    // A database outage should cost the crawler the dynamic URLs, not the
    // whole file: a 500 here makes Google back off the sitemap entirely.
    console.error("Error generating sitemap:", error);
    return staticEntries;
  }
}
