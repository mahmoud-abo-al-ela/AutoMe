// Car CRUD service functions
import { v4 as uuidv4 } from "uuid";
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import * as storageService from "@/lib/services/storage";
import { AuthenticationError, ConflictError, NotFoundError, AuthorizationError, PlanLimitError, logError } from "@/lib/utils/errors";
import { planInEffect } from "@/lib/services/billing/entitlements";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";
import { normalizeCarStatus } from "@/lib/constants/car-options";
import { getOrganizationById } from "@/lib/getOrganization";
import { auditHelpers } from "@/lib/services/audit/audit";
import { searchTermsChanged } from "@/lib/jobs/search-terms";
import type { CarStatus } from "@/lib/generated/prisma";
import { licenseMonthToDate } from "@/lib/utils/car-disclosures";
import { discardUploads, sortEditedPhotos } from "./photos";
import type { CarInput, UpdateCarInput, UpdateCarFullInput } from "@/lib/validations/schemas";

/**
 * The caller may act in this dealership: a member of it, or a platform admin
 * in a verified support session for exactly this dealership. The ADMIN role
 * alone is not enough — sessions are how admins act, time-boxed and audited.
 */
async function assertCanActIn(
  user: { memberships?: { organizationId: string }[] | null },
  organizationId: string,
  message: string
) {
  const isMember = user.memberships?.some((m) => m.organizationId === organizationId);
  if (!isMember && !(await isImpersonatingOrganization(organizationId))) {
    throw new AuthorizationError(message);
  }
}

/** Who the Activity page credits with a change: the database user. */
const actorOf = (user: { id?: string | null; email?: string | null }) => ({ id: user.id, email: user.email });

/** Either status spelling to the DB enum; a missing status is AVAILABLE. */
function toCarStatus(status: string | null | undefined): CarStatus {
  return normalizeCarStatus(status) ?? "AVAILABLE";
}

/**
 * The disclosure columns from validated input. `undefined` leaves a column
 * untouched (a caller that does not send them, like the AI draft path); `null`
 * clears it, which is how the form says "not stated".
 */
function disclosureColumns(data: CarInput | UpdateCarFullInput) {
  return {
    originalPaint: data.originalPaint,
    accidentFree: data.accidentFree,
    ownerCount: data.ownerCount,
    serviceHistory: data.serviceHistory,
    priceNegotiable: data.priceNegotiable,
    licenseValidUntil:
      data.licenseValidUntil === undefined ? undefined : licenseMonthToDate(data.licenseValidUntil),
  };
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

  await assertCanActIn(user, organizationId, "You don't have access to this organization");

  // The plan in effect now: its photo and car limits.
  const organization = await getOrganizationById(organizationId);
  const plan = organization ? await planInEffect(organization) : null;
  const maxImagesPerCar = plan?.maxImagesPerCar ?? 5;

  const carId = uuidv4();
  const imageUrls = await storageService.uploadCarImages(carData.images, carId, "car-images", maxImagesPerCar);
  const status = toCarStatus(carData.status);

  // The authoritative car-limit check, under the dealership's lock with the
  // insert (withUsageLimit's earlier check is only the fast refusal).
  const car = await carRepository.createCarWithinLimit({
    id: carId,
    organizationId,
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
    titleEn: carData.titleEn,
    titleAr: carData.titleAr,
    descriptionEn: carData.descriptionEn,
    descriptionAr: carData.descriptionAr,
    location: carData.location,
    features: carData.features,
    featuresAr: carData.featuresAr,
    ...disclosureColumns(carData),
    seats: carData.seats,
    status,
    featured: carData.featured,
    images: imageUrls,
  }, plan?.maxCars ?? 0);
  if (!car) {
    // Another save took the last place while this one uploaded its photos.
    await storageService.deleteCarImages(imageUrls, carId).catch((error: unknown) =>
      logError("Could not delete the photos of a car refused at its plan's limit", error)
    );
    throw new PlanLimitError({
      resource: "cars",
      planType: plan?.name,
      limit: plan?.maxCars ?? 0,
      upgradeUrl: organization ? `/org/${organization.slug}/billing` : undefined,
      message: "Upgrade your plan to add more cars to your inventory.",
    });
  }

  await auditHelpers.logCarCreated({ ...car, organizationId }, actorOf(user));
  await searchTermsChanged();
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

  // The car must be this dealership's — whoever asks, admins included.
  await assertCanActIn(user, organizationId, "You don't have access to this car");
  if (existingCar.organizationId !== organizationId) {
    throw new AuthorizationError("You don't have access to this car");
  }

  // The schema has already normalised status to the DB enum; an absent one
  // stays absent (this is a partial update), rather than becoming AVAILABLE.
  const dataToUpdate: UpdateCarInput = { ...updateData };

  const updated = await carRepository.updateCar(carId, organizationId, dataToUpdate);
  if (!updated) throw new NotFoundError("Car");
  await auditHelpers.logCarChanged(existingCar, { ...existingCar, ...dataToUpdate }, actorOf(user));
  // A status decides whether the car is listed; featured changes no word.
  if (dataToUpdate.status !== undefined) await searchTermsChanged();
  return updated;
}

/**
 * Change the status or featured flag of several of the organization's cars at
 * once, from the Cars table's selection. The repository scopes the write by
 * organization, so a foreign id is skipped rather than trusted; returns how
 * many cars changed.
 */
export async function updateCars(
  carIds: string[],
  updateData: UpdateCarInput,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }
  await assertCanActIn(user, organizationId, "You don't have access to these cars");

  const before = await carRepository.findCarsByIds(carIds, organizationId);
  const changed = await carRepository.updateManyCars(carIds, organizationId, { ...updateData });
  // One entry per car, so each car's history shows it.
  await Promise.all(
    before.flatMap((car) => (car ? [auditHelpers.logCarChanged(car, { ...car, ...updateData }, actorOf(user))] : [])),
  );
  if (changed > 0 && updateData.status !== undefined) await searchTermsChanged();
  return changed;
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

  // The car must be this dealership's — whoever asks, admins included.
  await assertCanActIn(user, organizationId, "You don't have access to this car");
  if (car.organizationId !== organizationId) {
    throw new AuthorizationError("You don't have access to this car");
  }

  if ((await carRepository.deleteCarById(carId, organizationId)) === 0) {
    throw new NotFoundError("Car");
  }
  await auditHelpers.logCarDeleted(car, actorOf(user));
  await searchTermsChanged();

  if (car.images && car.images.length > 0) {
    // The car is gone from the database, which is what the dealer asked;
    // a photo left in storage is only tidiness, so it must not fail the delete.
    await storageService.deleteCarImages(car.images, carId).catch((error: unknown) =>
      logError(`Could not delete the photos of deleted car ${carId}`, error)
    );
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

  // The car must be this dealership's — whoever asks, admins included.
  await assertCanActIn(user, organizationId, "You don't have access to this car");
  if (car.organizationId !== organizationId) {
    throw new AuthorizationError("You don't have access to this car");
  }

  const updated = await carRepository.updateCar(carId, organizationId, { featured: !car.featured });
  if (!updated) throw new NotFoundError("Car");
  await auditHelpers.logCarChanged(car, { ...car, featured: !car.featured }, actorOf(user));
  return updated;
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

  // The car must be this dealership's — whoever asks, admins included.
  await assertCanActIn(user, organizationId, "You don't have access to this car");
  if (existingCar.organizationId !== organizationId) {
    throw new AuthorizationError("You don't have access to this car");
  }

  // The whole photo list is checked before anything is uploaded or deleted.
  const organization = await getOrganizationById(organizationId);
  const maxImagesPerCar = (organization ? await planInEffect(organization) : null)?.maxImagesPerCar ?? 5;
  const { kept: existingImages, added: newImageFiles, removed: deletedImages } =
    sortEditedPhotos(existingCar.images, carData.images, maxImagesPerCar);

  // Upload, then write, then delete what the edit dropped. Deleting first
  // meant a failed upload or write left the car pointing at files that were
  // already gone.
  let newImageUrls: string[] = [];
  if (newImageFiles.length > 0) {
    newImageUrls = await storageService.uploadCarImages(newImageFiles, carId, "car-images", maxImagesPerCar);
  }

  const finalImages = [...existingImages, ...newImageUrls];
  const status = toCarStatus(carData.status);

  // Lands only if the photos are still the ones this edit was sorted against.
  const write = await carRepository.updateCarIfPhotosUnchanged(carId, organizationId, existingCar.images || [], {
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
    titleEn: carData.titleEn,
    titleAr: carData.titleAr,
    descriptionEn: carData.descriptionEn,
    descriptionAr: carData.descriptionAr,
    location: carData.location,
    features: carData.features,
    featuresAr: carData.featuresAr,
    ...disclosureColumns(carData),
    seats: carData.seats,
    status,
    featured: carData.featured,
    images: finalImages,
  }).catch(async (error: unknown) => {
    await discardUploads(newImageUrls, carId);
    throw error;
  });
  if (write.status !== "updated") {
    await discardUploads(newImageUrls, carId);
    if (write.status === "notFound") throw new NotFoundError("Car");
    throw new ConflictError("The car's photos changed meanwhile", { key: "errors.upload.photosChanged" });
  }
  const updatedCar = write.car;

  if (deletedImages.length > 0) {
    // Best effort, like a deleted car's: a photo left in storage must not
    // fail the dealer's edit.
    await storageService.deleteCarImages(deletedImages, carId).catch((error: unknown) =>
      logError(`Could not delete removed photos of car ${carId}`, error)
    );
  }

  await auditHelpers.logCarChanged(
    existingCar,
    {
      ...existingCar,
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price: carData.price,
      mileage: carData.mileage,
      status,
      featured: carData.featured,
    },
    actorOf(user),
  );
  await searchTermsChanged();
  return updatedCar;
}
