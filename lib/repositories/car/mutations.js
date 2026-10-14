// Car mutation functions
import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";
import { lockOrganizationResource } from "../organization-lock";

/**
 * Create a new car
 */
export async function createCar(carData) {
  const car = await db.car.create({
    data: carData,
  });

  return serializeCar(car);
}

/** Prisma's "no row matched" (P2025), read structurally: the class is a type-only re-export. */
function isRecordNotFound(error) {
  return typeof error === "object" && error !== null && error.code === "P2025";
}

/**
 * Create a car only if the dealership is under its plan's car limit (-1: no
 * limit). The count and the insert run under the dealership's "cars" lock, so
 * two saves at the last free place cannot both pass: one gets null.
 *
 * @param {Parameters<typeof db.car.create>[0]["data"] & { organizationId: string }} carData
 * @param {number} maxCars
 */
export async function createCarWithinLimit(carData, maxCars) {
  return db.$transaction(async (tx) => {
    await lockOrganizationResource(tx, carData.organizationId, "cars");
    if (maxCars !== -1) {
      const count = await tx.car.count({ where: { organizationId: carData.organizationId } });
      if (count >= maxCars) return null;
    }
    return serializeCar(await tx.car.create({ data: carData }));
  });
}

/**
 * Update one of a dealership's cars. Scoped by organization in the WHERE
 * clause, so an id from another tenant updates nothing rather than trusting
 * the caller to have checked; null when no car of this dealership matched.
 */
export async function updateCar(id, organizationId, carData) {
  try {
    const car = await db.car.update({
      where: { id, organizationId },
      data: carData,
    });
    return serializeCar(car);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

/**
 * Store a car's image alt text. Scoped by organization in the WHERE clause,
 * so an id from another tenant updates nothing rather than trusting the caller
 * to have checked. Does not touch any column the dealer edits.
 */
export async function updateCarImageAlts(id, organizationId, imageAlts) {
  const { count } = await db.car.updateMany({
    where: { id, organizationId },
    data: { imageAlts },
  });
  return count;
}

/**
 * Delete one of a dealership's cars. Scoped by organization in the WHERE
 * clause; returns how many were deleted (0 for another tenant's id).
 */
export async function deleteCarById(id, organizationId) {
  const { count } = await db.car.deleteMany({
    where: { id, organizationId },
  });
  return count;
}

/**
 * Change several cars at once. Scoped by organization in the WHERE clause, so
 * an id from another tenant updates nothing; returns how many changed.
 */
export async function updateManyCars(ids, organizationId, carData) {
  const { count } = await db.car.updateMany({
    where: { id: { in: ids }, organizationId },
    data: carData,
  });
  return count;
}
