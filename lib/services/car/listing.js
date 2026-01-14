// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";

/**
 * Get cars with filters and pagination
 */
export async function getCars(filters, pagination) {
    return await carRepository.findManyCars(filters, pagination);
}

/**
 * Get filter options
 */
export async function getFilterOptions(baseFilters = {}) {
    const [makes, bodyTypes, fuelTypes, transmissions, priceRange] = await Promise.all([
        carRepository.getCarDistinctValues("make", baseFilters),
        carRepository.getCarDistinctValues("bodyType", baseFilters),
        carRepository.getCarDistinctValues("fuelType", baseFilters),
        carRepository.getCarDistinctValues("transmission", baseFilters),
        carRepository.getCarPriceRange(baseFilters),
    ]);

    return {
        makes,
        bodyTypes,
        fuelTypes,
        transmissions,
        priceRange,
    };
}
