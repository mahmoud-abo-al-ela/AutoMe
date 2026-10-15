// Car repository - a full edit's write, conditional on the photos it read.
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";

export type PhotoEditWrite =
  | { status: "updated"; car: ReturnType<typeof serializeCar> }
  | { status: "notFound" }
  | { status: "photosChanged" };

/** Writes only if the photos are still `expectedImages`. Not keyed on updatedAt: the alt-text job bumps it after every save. */
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
