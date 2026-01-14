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
 * Delete a car
 */
export async function deleteCarById(id) {
  await db.car.delete({
    where: { id },
  });
}
