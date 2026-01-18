"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as carService from "@/lib/services/car";
import * as wishlistService from "@/lib/services/wishlist";
import * as carRepository from "@/lib/repositories/car";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError, ValidationError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { serializeCarWithImages } from "@/lib/utils/serializers";

export async function getCars(filters) {
  try {
    const { userId } = await auth();

    const organization = await getCurrentOrganization();
    
    // Get cars with filters
    const result = await carService.getCars(filters, {
      page: filters.page,
      limit: filters.limit,
    }, userId, organization?.id);

    // Add wishlist status if user is logged in
    if (userId) {
      const wishlistIds = await wishlistService.getWishlistCarIds(userId);
      result.cars = result.cars.map((car) => ({
        ...car,
        isWishlisted: wishlistIds.has(car.id),
      }));
    } else {
      result.cars = result.cars.map((car) => ({
        ...car,
        isWishlisted: false,
      }));
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error fetching cars", error);
    return createErrorResponse(error);
  }
}

export async function getCarById(id) {
  try {
    const { userId } = await auth();

    const car = await carService.getCarById(id);

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
  } catch (error) {
    console.error("Error fetching car by id", error);
    return createErrorResponse(error);
  }
}

export async function getCarsFilters(filters = {}) {
  try {
    const { userId } = await auth();
    const organization = await getCurrentOrganization();
    const filterOptions = await carService.getFilterOptions(filters, userId, organization?.id);

    return createSuccessResponse({
      ...filterOptions,
      appliedFilters: filters,
    });
  } catch (error) {
    console.error("Error fetching cars filters", error);
    return createErrorResponse(error);
  }
}

export async function toggleWishlist(carId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await wishlistService.toggleWishlist(carId, userId);

    revalidatePath("/wishlist");
    revalidatePath("/cars");

    return createSuccessResponse(result, result.message);
  } catch (error) {
    console.error("Error toggling wishlist", error);
    return createErrorResponse(error);
  }
}

export async function getWishlist({ page = 1, limit = 6 } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await wishlistService.getUserWishlist(userId, { page, limit });

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error fetching saved cars", error);
    return createErrorResponse(error);
  }
}

export async function getCarsByIds(carIds) {
  try {
    if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
      throw new ValidationError("No car IDs provided", "carIds");
    }

    const cars = await carRepository.findCarsByIds(carIds);

    if (!cars || cars.length === 0) {
      throw new ValidationError("No cars found with the provided IDs", "carIds");
    }

    const carsWithImages = cars.map(serializeCarWithImages);

    return createSuccessResponse(carsWithImages);
  } catch (error) {
    console.error("Error fetching cars by IDs", error);
    return createErrorResponse(error);
  }
}
