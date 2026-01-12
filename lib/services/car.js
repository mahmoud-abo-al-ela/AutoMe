// Car service - Business logic layer (Functional approach)
import { v4 as uuidv4 } from "uuid";
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import * as storageService from "@/lib/services/storage";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";
import { STATUS_FORM_TO_DB } from "@/lib/constants/car-options";

/**
 * Get cars with filters and pagination
 */
export async function getCars(filters, pagination) {
    return await carRepository.findManyCars(filters, pagination);
}

/**
 * Get car by ID
 */
export async function getCarById(id) {
    const car = await carRepository.findCarById(id);

    if (!car) {
        throw new NotFoundError("Car");
    }

    return car;
}

/**
 * Create a new car
 */
export async function createCar(carData, userId) {
    // Validate user
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Generate car ID
    const carId = uuidv4();

    // Upload images
    const imageUrls = await storageService.uploadCarImages(carData.images, carId);

    // Map status from form to database enum
    const status = STATUS_FORM_TO_DB[carData.status] || "AVAILABLE";

    // Create car in database
    const car = await carRepository.createCar({
        id: carId,
        title: carData.title,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        color: carData.color,
        price: carData.price,
        mileage: carData.mileage,
        bodyType: carData.bodyType,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        description: carData.description,
        location: carData.location,
        features: carData.features,
        seats: carData.seats,
        status,
        featured: carData.featured,
        images: imageUrls,
    });

    return car;
}

/**
 * Update a car
 */
export async function updateCar(carId, updateData, userId) {
    // Validate user
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Check if car exists
    const existingCar = await carRepository.findCarById(carId);
    if (!existingCar) {
        throw new NotFoundError("Car");
    }

    // Map status if provided
    const dataToUpdate = { ...updateData };
    if (updateData.status) {
        dataToUpdate.status = STATUS_FORM_TO_DB[updateData.status] || updateData.status;
    }

    // Update car
    const updatedCar = await carRepository.updateCar(carId, dataToUpdate);

    return updatedCar;
}

/**
 * Delete a car
 */
export async function deleteCar(carId, userId) {
    // Validate user
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Get car to retrieve image URLs
    const car = await carRepository.findCarById(carId);
    if (!car) {
        throw new NotFoundError("Car");
    }

    // Delete car from database
    await carRepository.deleteCarById(carId);

    // Delete images from storage
    if (car.images && car.images.length > 0) {
        await storageService.deleteCarImages(car.images);
    }

    return { message: "Car deleted successfully" };
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

/**
 * Toggle featured status
 */
export async function toggleFeatured(carId, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    const car = await carRepository.findCarById(carId);
    if (!car) {
        throw new NotFoundError("Car");
    }

    return await carRepository.updateCar(carId, { featured: !car.featured });
}
