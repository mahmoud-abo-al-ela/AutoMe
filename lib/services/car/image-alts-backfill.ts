import * as carRepository from "@/lib/repositories/car";
import { refreshImageAlts } from "./image-alts";

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
