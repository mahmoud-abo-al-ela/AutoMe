// Dealership repository functions
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
                    { dayOfWeek: ["MONDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["TUESDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["WEDNESDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["THURSDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["FRIDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["SATURDAY"], openTime: "09:00", closeTime: "18:00", isOpen: true },
                    { dayOfWeek: ["SUNDAY"], openTime: "09:00", closeTime: "18:00", isOpen: false },
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
