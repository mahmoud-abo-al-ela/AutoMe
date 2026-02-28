// User wishlist functions
import { db } from "@/lib/prisma";
import { serializeCar } from "@/lib/utils/serializers";

/**
 * Get user's wishlist, optionally filtered by organization
 */
export async function getUserWishlist(userId, pagination = {}, organizationId = null) {
  const { page = 1, limit = 6 } = pagination;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (organizationId) {
    where.car = { organizationId };
  }

  const [savedCars, total] = await Promise.all([
    db.savedCar.findMany({
      where,
      include: { car: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.savedCar.count({ where }),
  ]);

  return {
    cars: savedCars.map((sc) => ({
      ...serializeCar(sc.car),
      isWishlisted: true, // All cars in wishlist should be marked as wishlisted
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Check if car is in user's wishlist
 */
export async function isCarInWishlist(userId, carId) {
  const savedCar = await db.savedCar.findUnique({
    where: {
      userId_carId: { userId, carId },
    },
  });

  return !!savedCar;
}

/**
 * Add car to wishlist
 */
export async function addCarToWishlist(userId, carId) {
  await db.savedCar.create({
    data: { userId, carId },
  });
}

/**
 * Remove car from wishlist
 */
export async function removeCarFromWishlist(userId, carId) {
  await db.savedCar.delete({
    where: {
      userId_carId: { userId, carId },
    },
  });
}

/**
 * Get user's wishlist car IDs
 */
export async function getUserWishlistCarIds(userId) {
  const savedCars = await db.savedCar.findMany({
    where: { userId },
    select: { carId: true },
  });

  return new Set(savedCars.map((sc) => sc.carId));
}
