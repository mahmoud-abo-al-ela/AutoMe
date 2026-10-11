import * as sitemapRepository from "@/lib/repositories/sitemap";

/**
 * The public listings the sitemap names: every available car and every listed
 * dealership, most recently changed first, within the repository's caps. Which
 * cars and dealerships count as public is the repository's rule (the same one
 * the marketplace listings apply), so the sitemap can never name a page the
 * site would not show.
 */
export async function getSitemapListings() {
  const [cars, dealerships] = await Promise.all([
    sitemapRepository.findSitemapCars(),
    sitemapRepository.findSitemapDealerships(),
  ]);
  return { cars, dealerships };
}
