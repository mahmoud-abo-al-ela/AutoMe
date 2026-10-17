import * as carRepository from "@/lib/repositories/car";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { assertBuyerAllowed } from "@/lib/auth/assert-buyer";
import type { BuyerViewerSource } from "@/lib/auth/buyer-policy";
import { NotFoundError } from "@/lib/utils/errors";

export async function findBookableCar(carId: string, viewer: BuyerViewerSource) {
  // A car the public may open (repositories/car/visibility.ts): a hidden
  // dealership's car cannot be booked, and is not found rather than refused.
  const car = await carRepository.findPublicCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  // On a subdomain, only that dealership's cars can be booked.
  const organization = await getCurrentOrganization();
  if (organization && car.organizationId !== organization.id) {
    throw new NotFoundError("Car");
  }

  assertBuyerAllowed(viewer, car.organizationId, "testDrive");
  return car;
}
