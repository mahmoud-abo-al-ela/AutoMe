// Wishlist service - Business logic layer
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";
import { assertBuyerAllowed, assertNotImpersonating } from "@/lib/auth/assert-buyer";
import type { BuyerViewerSource } from "@/lib/auth/buyer-policy";

/**
 * Get user's wishlist, optionally filtered by organization
 */
export async function getUserWishlist(userId: string, pagination: { page?: number; limit?: number }, organizationId: string | null = null) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return await userRepository.getUserWishlist(user.id, pagination, organizationId);
}

export async function toggleWishlist(carId: string, userId: string, viewer: BuyerViewerSource) {
  assertNotImpersonating(viewer);

  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const car = await carRepository.findCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  const isInWishlist = await userRepository.isCarInWishlist(user.id, carId);

  if (isInWishlist) {
    await userRepository.removeCarFromWishlist(user.id, carId);
    return { message: "Car removed from wishlist", isWishlisted: false };
  } else {
    // Saving needs a car the public may open; removing never does, so a car
    // whose dealership was suspended can still be cleared from the list.
    if (!(await carRepository.findPublicCarById(carId))) {
      throw new NotFoundError("Car");
    }
    assertBuyerAllowed(viewer, car.organizationId, "save");
    await userRepository.addCarToWishlist(user.id, carId);
    return { message: "Car added to wishlist", isWishlisted: true };
  }
}

/**
 * Check if car is in user's wishlist
 */
export async function isCarInUserWishlist(carId: string, userId: string) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    return false;
  }

  return await userRepository.isCarInWishlist(user.id, carId);
}

/**
 * Get wishlist car IDs for user
 */
export async function getWishlistCarIds(userId: string) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    return new Set();
  }

  return await userRepository.getUserWishlistCarIds(user.id);
}

export async function setCarSaved(carId: string, userId: string, viewer: BuyerViewerSource, saved: boolean) {
  assertNotImpersonating(viewer);

  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  if (!saved) {
    return { saved: false, changed: await userRepository.unsaveCarOnce(user.id, carId) };
  }

  const car = await carRepository.findPublicCarById(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }
  assertBuyerAllowed(viewer, car.organizationId, "save");
  return { saved: true, changed: await userRepository.saveCarOnce(user.id, carId) };
}
