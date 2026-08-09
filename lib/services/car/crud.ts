// Car CRUD service functions
import { v4 as uuidv4 } from "uuid";
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import * as storageService from "@/lib/services/storage";
import { AuthenticationError, NotFoundError, AuthorizationError } from "@/lib/utils/errors";
import { STATUS_FORM_TO_DB } from "@/lib/constants/car-options";
import { getOrganizationById } from "@/lib/getOrganization";
import type { CarStatus } from "@/lib/generated/prisma";
import type { CarInput, UpdateCarInput, UpdateCarFullInput } from "@/lib/validations/schemas";

/**
 * Map a form status label to its DB enum, defaulting to AVAILABLE. The form
 * value is a free string at this boundary, so the lookup is indexed loosely.
 */
function toCarStatus(formStatus: string | null | undefined): CarStatus {
  return (
    (STATUS_FORM_TO_DB as Record<string, CarStatus>)[formStatus ?? ""] ||
    "AVAILABLE"
  );
}

/**
 * Get car by ID
 */
export async function getCarById(id: string) {
  const car = await carRepository.findCarById(id);

  if (!car) {
    throw new NotFoundError("Car");
  }

  return car;
}

/**
 * Create a new car (organization-scoped)
 */
export async function createCar(
  carData: CarInput,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  // Get plan-based max images limit
  const organization = await getOrganizationById(organizationId);
  const maxImagesPerCar = organization?.subscription?.plan?.maxImagesPerCar ?? 5;

  const carId = uuidv4();
  const imageUrls = await storageService.uploadCarImages(carData.images, carId, "car-images", maxImagesPerCar);
  const status = toCarStatus(carData.status);

  const car = await carRepository.createCar({
    id: carId,
    organizationId,
    // BUG (surfaced by this conversion, NOT fixed here): carSchema has no
    // `title` field, so validateAction strips it before this point and every
    // car created through addCar lands with a null title — even though the
    // form collects one and updateCarFullSchema does declare it. Behaviour
    // preserved; adding title to carSchema belongs in its own PR.
    title: (carData as { title?: string }).title,
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
 * Update a car (organization-scoped)
 */
export async function updateCar(
  carId: string,
  updateData: UpdateCarInput,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const existingCar = await carRepository.findCarById(carId);
  if (!existingCar) {
    throw new NotFoundError("Car");
  }

  // Verify car belongs to user's organization
  if (existingCar.organizationId !== organizationId && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }

  // Unlike the create/full-update paths this keeps an unmapped status as-is
  // rather than falling back to AVAILABLE, so it does not use toCarStatus.
  const dataToUpdate: UpdateCarInput & { status?: string } = { ...updateData };
  if (updateData.status) {
    dataToUpdate.status =
      (STATUS_FORM_TO_DB as Record<string, CarStatus>)[updateData.status] ||
      updateData.status;
  }

  return await carRepository.updateCar(carId, dataToUpdate);
}

/**
 * Delete a car (organization-scoped)
 */
export async function deleteCar(
  carId: string,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  // Verify car belongs to user's organization
  if (car.organizationId !== organizationId && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }

  await carRepository.deleteCarById(carId);

  if (car.images && car.images.length > 0) {
    await storageService.deleteCarImages(car.images);
  }

  return { message: "Car deleted successfully" };
}

/**
 * Toggle featured status (organization-scoped)
 */
export async function toggleFeatured(
  carId: string,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  // Verify car belongs to user's organization
  if (car.organizationId !== organizationId && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }

  return await carRepository.updateCar(carId, { featured: !car.featured });
}

/**
 * Update all car details including images (organization-scoped)
 */
export async function updateCarFull(
  carId: string,
  carData: UpdateCarFullInput,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const existingCar = await carRepository.findCarById(carId);
  if (!existingCar) {
    throw new NotFoundError("Car");
  }

  // Verify car belongs to user's organization
  if (existingCar.organizationId !== organizationId && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this car");
  }

  // Separate existing image URLs and new files
  const existingImages = carData.images.filter(img => typeof img === "string");
  const newImageFiles = carData.images.filter(img => typeof img !== "string");

  // Determine deleted images: images that were in existingCar.images but are not in existingImages
  const deletedImages = (existingCar.images || []).filter(img => !existingImages.includes(img));

  // Delete removed images from storage
  if (deletedImages.length > 0) {
    await storageService.deleteCarImages(deletedImages);
  }

  // Upload new images to Supabase
  let newImageUrls: string[] = [];
  if (newImageFiles.length > 0) {
    const organization = await getOrganizationById(organizationId);
    const maxImagesPerCar = organization?.subscription?.plan?.maxImagesPerCar ?? 5;
    
    // Upload new images
    newImageUrls = await storageService.uploadCarImages(newImageFiles, carId, "car-images", maxImagesPerCar);
  }

  // Combine existing image URLs and new uploaded URLs
  const finalImages = [...existingImages, ...newImageUrls];

  const status = toCarStatus(carData.status);

  const updatedCar = await carRepository.updateCar(carId, {
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
    images: finalImages,
  });

  return updatedCar;
}
