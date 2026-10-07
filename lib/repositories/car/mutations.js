// Car mutation functions
import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";

/**
 * Create a new car
 */
export async function createCar(carData) {
  const car = await db.car.create({
    data: carData,
  });

  return serializeCar(car);
}

/**
 * Update a car
 */
export async function updateCar(id, carData) {
  const car = await db.car.update({
    where: { id },
    data: carData,
  });

  return serializeCar(car);
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
 * Delete a car
 */
export async function deleteCarById(id) {
  await db.car.delete({
    where: { id },
  });
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
