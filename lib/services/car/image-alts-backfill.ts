import * as carRepository from "@/lib/repositories/car";
import { refreshImageAlts } from "./image-alts";

/**
 * Describe the photos of a batch of cars listed before photo descriptions
 * existed, oldest id first after `after`. The cursor is what moves the
 * backfill past a car whose photos cannot be described (a dead image URL)
 * instead of retrying it forever.
 *
 * Platform-paid, like the descriptions written on save: metered as
 * carImageAltText, which no plan allowance counts, at low priority so it never
 * takes capacity a dealer is waiting on.
 */
export async function backfillImageAlts(limit: number, after?: string) {
  const cars = await carRepository.findCarsMissingImageAlts({ take: limit, afterId: after });
  for (const car of cars) {
    // Scoped to the car's own dealership inside; never throws.
    await refreshImageAlts(car.id, car.organizationId, {
      organizationId: car.organizationId,
      userId: null,
      priority: "low",
    });
  }
  const next = cars.at(-1)?.id ?? null;
  const remaining = next ? await carRepository.countCarsMissingImageAlts(next) : 0;
  return { processed: cars.length, next, remaining };
}
