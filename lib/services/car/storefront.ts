import * as carRepository from "@/lib/repositories/car";
import { NotFoundError } from "@/lib/utils/errors";
import type { SerializedCar } from "@/lib/utils/serializers";
import { CAR_CURRENCY } from "@/lib/utils/currency";
import { withMarketPositions } from "./market-price";

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

export async function getPublicCarById(id: string) {
  const car = await carRepository.findPublicCarById(id);
  if (!car) throw new NotFoundError("Car");
  return car;
}

/** The cars a buyer is comparing, limited to the subdomain's dealership when on one. */
export async function getCarsForComparison(carIds: string[], organizationId: string | null) {
  return carRepository.findPublicCarsByIds(carIds, organizationId);
}

/** Public titles, both languages, for the given car ids; unknown ids are absent. */
export async function getCarTitles(carIds: string[]) {
  return carRepository.findCarTitlesByIds(carIds);
}
