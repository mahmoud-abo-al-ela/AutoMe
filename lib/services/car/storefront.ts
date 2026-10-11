import * as carRepository from "@/lib/repositories/car";
import type { SerializedCar } from "@/lib/utils/serializers";
import { CAR_CURRENCY } from "@/lib/utils/currency";
import { withMarketPositions } from "./market-price";

/**
 * Public reads for the storefront: the home page's featured cars and live
 * numbers, the compare page, and the car titles a chat list shows. Each takes
 * the dealership of the subdomain being browsed, or null on the marketplace.
 */

/** Featured, available cars, each with where its price sits in the market. */
export async function getFeaturedCars(organizationId: string | null, limit: number) {
  const result = await carRepository.findManyCars(
    {
      featured: true,
      onlyAvailable: true,
      ...(organizationId && { organizationId }),
    },
    { page: 1, limit }
  );
  // findManyCars only ever serializes real rows; see getCars.
  return withMarketPositions(result.cars as SerializedCar[]);
}

/** Cars on sale, dealerships, cities, median price and last update. */
export async function getMarketSummary(organizationId: string | null) {
  return carRepository.getMarketSummary({ organizationId, currency: CAR_CURRENCY });
}

/** The cars a buyer is comparing, limited to the subdomain's dealership when on one. */
export async function getCarsForComparison(carIds: string[], organizationId: string | null) {
  return carRepository.findCarsByIds(carIds, organizationId);
}

/** Public titles, both languages, for the given car ids; unknown ids are absent. */
export async function getCarTitles(carIds: string[]) {
  return carRepository.findCarTitlesByIds(carIds);
}
