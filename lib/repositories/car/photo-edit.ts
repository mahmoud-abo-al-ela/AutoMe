// Car repository - a full edit's write, conditional on the photos it read.
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";

export type PhotoEditWrite =
  | { status: "updated"; car: ReturnType<typeof serializeCar> }
  | { status: "notFound" }
  | { status: "photosChanged" };

/**
 * Update one of a dealership's cars only while its photos are still
 * `expectedImages` — the list the edit was computed from. A compare-and-set:
 * if another edit changed the photos in between, nothing is written, so this
 * edit can neither drop photos the other added nor go on to delete photos the
 * row still lists.
 *
 * Keyed on `images`, not `updatedAt`: the alt-text job writes the car right
 * after every save, and would make a dealer's next quick edit lose for nothing.
 * Scoped by organization in the WHERE as well.
 */
export async function updateCarIfPhotosUnchanged(
  id: string,
  organizationId: string,
  expectedImages: string[],
  data: Prisma.CarUpdateManyMutationInput
): Promise<PhotoEditWrite> {
  const { count } = await db.car.updateMany({
    where: { id, organizationId, images: { equals: expectedImages } },
    data,
  });
  const car = await db.car.findFirst({ where: { id, organizationId } });
  if (!car) return { status: "notFound" };
  if (count === 0) return { status: "photosChanged" };
  return { status: "updated", car: serializeCar(car) };
}
