// User data access layer - Functional approach
import { db } from "@/lib/prisma";
import { serializeUser, serializeCar } from "@/lib/utils/serializers";

/**
 * Find user by Clerk ID
 */
export async function findUserByClerkId(clerkId) {
    const user = await db.user.findUnique({
        where: { clerkId },
    });

    return serializeUser(user);
}

/**
 * Find user by ID
 */
export async function findUserById(id) {
    const user = await db.user.findUnique({
        where: { id },
    });

    return serializeUser(user);
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
    const user = await db.user.findUnique({
        where: { email },
    });

    return serializeUser(user);
}

/**
 * Create a new user
 */
export async function createUser(userData) {
    const user = await db.user.create({
        data: userData,
    });

    return serializeUser(user);
}

/**
 * Update a user
 */
export async function updateUser(id, userData) {
    const user = await db.user.update({
        where: { id },
        data: userData,
    });

    return serializeUser(user);
}

/**
 * Get user's wishlist
 */
export async function getUserWishlist(userId, pagination = {}) {
    const { page = 1, limit = 6 } = pagination;
    const skip = (page - 1) * limit;

    const [savedCars, total] = await Promise.all([
        db.savedCar.findMany({
            where: { userId },
            include: { car: true },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        db.savedCar.count({ where: { userId } }),
    ]);

    return {
        cars: savedCars.map((sc) => serializeCar(sc.car)),
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
