// Data serialization utilities

/**
 * Serialize a single car object
 * @param {Object} car - Car object from database
 * @returns {Object} Serialized car object
 */
export function serializeCar(car) {
    if (!car) return null;

    return {
        ...car,
        price: parseFloat(car.price.toString()),
        createdAt: car.createdAt instanceof Date ? car.createdAt.toISOString() : car.createdAt,
        updatedAt: car.updatedAt instanceof Date ? car.updatedAt.toISOString() : car.updatedAt,
    };
}

/**
 * Serialize an array of cars
 * @param {Array} cars - Array of car objects
 * @returns {Array} Array of serialized car objects
 */
export function serializeCars(cars) {
    if (!Array.isArray(cars)) return [];
    return cars.map(serializeCar);
}

/**
 * Serialize car with wishlist status
 * @param {Object} car - Car object
 * @param {boolean} isWishlisted - Whether car is in user's wishlist
 * @returns {Object} Serialized car with wishlist status
 */
export function serializeCarWithWishlist(car, isWishlisted = false) {
    return {
        ...serializeCar(car),
        isWishlisted,
    };
}

/**
 * Serialize partial car object (for cases where only some fields are selected)
 * @param {Object} car - Partial car object from database
 * @returns {Object} Serialized partial car object
 */
export function serializePartialCar(car) {
    if (!car) return null;

    const serialized = { ...car };

    // Only serialize fields that exist
    if (car.price !== undefined) {
        serialized.price = parseFloat(car.price.toString());
    }
    if (car.createdAt !== undefined) {
        serialized.createdAt = car.createdAt instanceof Date ? car.createdAt.toISOString() : car.createdAt;
    }
    if (car.updatedAt !== undefined) {
        serialized.updatedAt = car.updatedAt instanceof Date ? car.updatedAt.toISOString() : car.updatedAt;
    }

    return serialized;
}

/**
 * Serialize car with images formatted for display
 * @param {Object} car - Car object
 * @returns {Object} Serialized car with formatted images
 */
export function serializeCarWithImages(car) {
    const serialized = serializeCar(car);

    return {
        ...serialized,
        images: serialized.images.map((url) => ({
            url,
            alt: `${car.make} ${car.model}`,
        })),
    };
}

/**
 * Serialize user object (remove sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Serialized user object
 */
export function serializeUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        role: user.role,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
}

/**
 * Serialize test drive object
 * @param {Object} testDrive - Test drive object from database
 * @returns {Object} Serialized test drive object
 */
export function serializeTestDrive(testDrive) {
    if (!testDrive) return null;

    return {
        ...testDrive,
        date: testDrive.date instanceof Date ? testDrive.date.toISOString() : testDrive.date,
        createdAt: testDrive.createdAt instanceof Date ? testDrive.createdAt.toISOString() : testDrive.createdAt,
        updatedAt: testDrive.updatedAt instanceof Date ? testDrive.updatedAt.toISOString() : testDrive.updatedAt,
        car: testDrive.car ? serializePartialCar(testDrive.car) : null,
        user: testDrive.user ? serializeUser(testDrive.user) : null,
    };
}
