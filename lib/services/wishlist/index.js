// Wishlist service - Business logic layer
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";

/**
 * Get user's wishlist
 */
export async function getUserWishlist(userId, pagination) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return await userRepository.getUserWishlist(user.id, pagination);
}

/**
 * Toggle car in wishlist
 */
export async function toggleWishlist(carId, userId) {
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
    await userRepository.addCarToWishlist(user.id, carId);
    return { message: "Car added to wishlist", isWishlisted: true };
  }
}

/**
 * Check if car is in user's wishlist
 */
export async function isCarInUserWishlist(carId, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    return false;
  }

  return await userRepository.isCarInWishlist(user.id, carId);
}

/**
 * Get wishlist car IDs for user
 */
export async function getWishlistCarIds(userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    return new Set();
  }

  return await userRepository.getUserWishlistCarIds(user.id);
}
