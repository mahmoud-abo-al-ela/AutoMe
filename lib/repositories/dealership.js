// Dealership data access layer - Functional approach
import { db } from "@/lib/prisma";

/**
 * Find first dealership with working hours
 */
export async function findDealership() {
    const dealership = await db.dealership.findFirst({
        include: {
            workingHours: { orderBy: { dayOfWeek: "asc" } },
        },
    });

    if (!dealership) return null;

    return {
        ...dealership,
        createdAt: dealership.createdAt.toISOString(),
        updatedAt: dealership.updatedAt.toISOString(),
    };
}

/**
 * Create dealership with default working hours
 */
export async function createDealership() {
    const dealership = await db.dealership.create({
        data: {
            workingHours: {
                create: [
                    {
                        dayOfWeek: ["MONDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["TUESDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["WEDNESDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["THURSDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["FRIDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["SATURDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: true,
                    },
                    {
                        dayOfWeek: ["SUNDAY"],
                        openTime: "09:00",
                        closeTime: "18:00",
                        isOpen: false,
                    },
                ],
            },
        },
        include: {
            workingHours: { orderBy: { dayOfWeek: "asc" } },
        },
    });

    return {
        ...dealership,
        createdAt: dealership.createdAt.toISOString(),
        updatedAt: dealership.updatedAt.toISOString(),
    };
}

/**
 * Update working hours
 */
export async function updateWorkingHours(dealershipId, workingHours) {
    // Delete existing working hours
    await db.workingHours.deleteMany({
        where: { dealershipId },
    });

    // Create new working hours
    const promises = workingHours.map((hour) =>
        db.workingHours.create({
            data: {
                dayOfWeek: Array.isArray(hour.dayOfWeek)
                    ? hour.dayOfWeek
                    : [hour.dayOfWeek],
                openTime: hour.openTime,
                closeTime: hour.closeTime,
                isOpen: hour.isOpen,
                dealershipId,
            },
        })
    );

    await Promise.all(promises);
}

/**
 * Find users with search and pagination
 */
export async function findManyUsers(search = "", pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
        OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ],
    };

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        db.user.count({ where }),
    ]);

    return {
        users: users.map((user) => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        })),
        pagination: {
            total,
            page,
            limit,
        },
    };
}

/**
 * Update user role
 */
export async function updateUserRole(userId, role) {
    await db.user.update({
        where: { id: userId },
        data: { role },
    });
}

/**
 * Delete user
 */
export async function deleteUserById(userId) {
    await db.user.delete({
        where: { id: userId },
    });
}
