// Dealership repository - platform stats queries
import { db } from "@/lib/prisma";

export async function getPlatformStats() {
    const [totalDealerships, totalCars, cities] = await Promise.all([
        db.organization.count({
            where: { isActive: true, deletedAt: null },
        }),
        db.car.count({
            where: {
                status: "AVAILABLE",
                organization: {
                    is: { isActive: true, deletedAt: null },
                },
            },
        }),
        db.organization.findMany({
            where: { isActive: true, deletedAt: null, city: { not: null } },
            select: { city: true },
            distinct: ["city"],
        }),
    ]);

    return {
        totalDealerships,
        totalCars,
        totalCities: cities.length,
    };
}

/**
 * Find dealership by slug with full details
 */
