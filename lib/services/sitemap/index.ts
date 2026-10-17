import * as sitemapRepository from "@/lib/repositories/sitemap";

export async function getSitemapListings() {
  const [cars, dealerships] = await Promise.all([
    sitemapRepository.findSitemapCars(),
    sitemapRepository.findSitemapDealerships(),
  ]);
  return { cars, dealerships };
}
