import * as carRepository from "@/lib/repositories/car";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { assertBuyerAllowed } from "@/lib/auth/assert-buyer";
import type { BuyerViewerSource } from "@/lib/auth/buyer-policy";
import { NotFoundError } from "@/lib/utils/errors";

/**
 * The car a buyer is booking, once it is clear they may: it exists, it belongs
 * to the dealership whose subdomain they are on (if any), and the buyer policy
 * allows this viewer to book it. Checked before anything is written.
 */
export async function findBookableCar(carId: string, viewer: BuyerViewerSource) {
  const car = await carRepository.findCarById(carId);
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
