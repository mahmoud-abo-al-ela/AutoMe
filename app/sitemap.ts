import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSitemapListings } from "@/lib/services/sitemap";
import { logError } from "@/lib/utils/errors";
import { requestOrigin } from "@/lib/utils/page-seo";
import { sitemapEntries } from "@/lib/utils/seo-meta";

const MARKETPLACE_PAGES = [
  "/",
  "/cars",
  "/dealerships",
  "/about",
  "/contact",
  "/faq",
  "/for-dealers",
  "/terms",
  "/privacy",
  "/cookies",
];

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
    const { cars, dealerships } = await getSitemapListings();

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
    logError("Sitemap could not list cars and dealerships; serving the static pages only", error);
    return staticEntries;
  }
}
