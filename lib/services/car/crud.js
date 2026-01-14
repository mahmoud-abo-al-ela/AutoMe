// Car CRUD service functions
import { v4 as uuidv4 } from "uuid";
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import * as storageService from "@/lib/services/storage";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";
import { STATUS_FORM_TO_DB } from "@/lib/constants/car-options";

/**
 * Get car by ID
 */
export async function getCarById(id) {
  const car = await carRepository.findCarById(id);

  if (!car) {
    throw new NotFoundError("Car");
  }

  return car;
}

/**
 * Create a new car
 */
export async function createCar(carData, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const carId = uuidv4();
  const imageUrls = await storageService.uploadCarImages(carData.images, carId);
  const status = STATUS_FORM_TO_DB[carData.status] || "AVAILABLE";

  const car = await carRepository.createCar({
    id: carId,
    title: carData.title,
    make: carData.make,
    model: carData.model,
    year: carData.year,
    color: carData.color,
    price: carData.price,
    mileage: carData.mileage,
    bodyType: carData.bodyType,
    fuelType: carData.fuelType,
    transmission: carData.transmission,
    description: carData.description,
    location: carData.location,
    features: carData.features,
    seats: carData.seats,
    status,
    featured: carData.featured,
    images: imageUrls,
  });

  return car;
}

/**
 * Update a car
 */
export async function updateCar(carId, updateData, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const existingCar = await carRepository.findCarById(carId);
  if (!existingCar) {
    throw new NotFoundError("Car");
  }

  const dataToUpdate = { ...updateData };
  if (updateData.status) {
    dataToUpdate.status =
      STATUS_FORM_TO_DB[updateData.status] || updateData.status;
  }

  return await carRepository.updateCar(carId, dataToUpdate);
}

/**
 * Delete a car
 */
export async function deleteCar(carId, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  await carRepository.deleteCarById(carId);

  if (car.images && car.images.length > 0) {
    await storageService.deleteCarImages(car.images);
  }

  return { message: "Car deleted successfully" };
}

/**
 * Toggle featured status
 */
export async function toggleFeatured(carId, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  return await carRepository.updateCar(carId, { featured: !car.featured });
}
