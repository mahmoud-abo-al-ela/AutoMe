"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as carService from "@/lib/services/car";
import * as wishlistService from "@/lib/services/wishlist";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling, withAuth } from "@/lib/middleware/with-auth";
import { ValidationError, NotFoundError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { serializeCarWithImages, type SerializedCar } from "@/lib/utils/serializers";
import type { CarFilters } from "@/lib/services/car/listing";

/** The listing filters plus the page/limit the client sends alongside them. */
type CarListingInput = CarFilters & { page?: number; limit?: number };

export const getCars = withErrorHandling(async (filters: CarListingInput) => {
  const { userId } = await auth();
  const organization = await getCurrentOrganization();

  // Get cars with filters
  const result = await carService.getCars(filters, {
    page: filters.page,
    limit: filters.limit,
  }, userId, organization?.id);

  // serializeCars maps a nullable serializer, but findManyCars only ever feeds
  // it real rows, so the nulls are not reachable here.
  const cars = result.cars as SerializedCar[];

  // Add wishlist status if user is logged in
  if (userId) {
    const wishlistIds = await wishlistService.getWishlistCarIds(userId);
    result.cars = cars.map((car) => ({
      ...car,
      isWishlisted: wishlistIds.has(car.id),
    }));
  } else {
    result.cars = cars.map((car) => ({
      ...car,
      isWishlisted: false,
    }));
  }

  return createSuccessResponse(result);
});

export const getCarById = withErrorHandling(async (id: string) => {
  const { userId } = await auth();

  const car = await carService.getCarById(id);

  // Validate car belongs to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  if (organization && car.organizationId !== organization.id) {
    throw new NotFoundError("Car");
  }

  // Check if in wishlist
  let isWishlisted = false;
  if (userId) {
    isWishlisted = await wishlistService.isCarInUserWishlist(id, userId);
  }

  const carWithImages = serializeCarWithImages(car);

  return createSuccessResponse({
    ...carWithImages,
    isWishlisted,
  });
});

export const getCarsFilters = withErrorHandling(async (filters: CarFilters = {}) => {
  const { userId } = await auth();
  const organization = await getCurrentOrganization();
  const filterOptions = await carService.getFilterOptions(filters, userId, organization?.id);

  return createSuccessResponse({
    ...filterOptions,
    appliedFilters: filters,
  });
});

export const toggleWishlist = withAuth(async (ctx, carId: string) => {
  const result = await wishlistService.toggleWishlist(carId, ctx.userId);

  revalidatePath("/wishlist");
  revalidatePath("/cars");

  return createSuccessResponse(result, result.message);
});

export const getWishlist = withAuth(
  async (ctx, { page = 1, limit = 6 }: { page?: number; limit?: number } = {}) => {
  // Scope to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  const result = await wishlistService.getUserWishlist(ctx.userId, { page, limit }, organization?.id || null);

  return createSuccessResponse(result);
});

export const getCarsByIds = withErrorHandling(async (carIds: string[]) => {
  if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
    throw new ValidationError("No car IDs provided", "carIds");
  }

  // Scope to current organization when on a subdomain
  const organization = await getCurrentOrganization();
  const cars = await carRepository.findCarsByIds(carIds, organization?.id || null);

  if (!cars || cars.length === 0) {
    throw new ValidationError("No cars found with the provided IDs", "carIds");
  }

  const carsWithImages = cars.map(serializeCarWithImages);

  return createSuccessResponse(carsWithImages);
});
