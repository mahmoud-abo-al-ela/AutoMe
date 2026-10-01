import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/utils/page-seo";
import { crawlDisallowPaths } from "@/lib/utils/seo-meta";

/**
 * Per host, like the sitemap it points at: a dealership subdomain names its
 * own `/sitemap.xml`, which lists that storefront's pages.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();

  return {
    rules: { userAgent: "*", allow: "/", disallow: crawlDisallowPaths() },
    sitemap: `${origin}/sitemap.xml`,
  };
}
