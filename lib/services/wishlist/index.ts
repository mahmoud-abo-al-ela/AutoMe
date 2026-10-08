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

/**
 * Toggle car in wishlist.
 *
 * `viewer` is the session user, checked against the buyer policy. Removing is
 * always allowed (outside impersonation) so an account that may no longer save
 * can still clear what it saved before.
 */
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
