import { compareUtils } from "@/lib/utils";
import { formatCarPrice } from "@/lib/utils/currency";

// ─── Formatting Utilities ────────────────────────────────────────────────────

/**
 * Format a numeric price as a USD currency string (no decimals).
 * @param {number} price
 * @returns {string} e.g. "$25,000"
 */
export const formatPrice = (price) => formatCarPrice(price);

/**
 * Format a numeric mileage value with the "mile" unit.
 * @param {number} mileage
 * @returns {string} e.g. "45,000 mi"
 */
export const formatMileage = (mileage) => {
    return new Intl.NumberFormat("en-US", {
        style: "unit",
        unit: "mile",
        maximumFractionDigits: 0,
    }).format(mileage);
};

// ─── Spec Category Definitions ───────────────────────────────────────────────

/**
 * Shared specification categories used by both desktop and mobile compare views.
 * Each category contains an array of spec definitions with label, data key,
 * and an optional format function.
 */
export const specCategories = [
    {
        id: "basic",
        title: "Basic Information",
        specs: [
            { label: "Make", key: "make" },
            { label: "Model", key: "model" },
            { label: "Year", key: "year" },
            { label: "Price", key: "price", format: formatPrice },
            { label: "Body Type", key: "bodyType" },
        ],
    },
    {
        id: "performance",
        title: "Performance & Specifications",
        specs: [
            { label: "Mileage", key: "mileage", format: formatMileage },
            { label: "Fuel Type", key: "fuelType" },
            { label: "Transmission", key: "transmission" },
            { label: "Color", key: "color" },
            { label: "Seats", key: "seats" },
        ],
    },
];

/**
 * Flat list of all spec keys across every category — useful for iteration.
 */
export const allSpecKeys = specCategories.flatMap((cat) =>
    cat.specs.map((s) => s.key)
);

// ─── Car Removal Handler ─────────────────────────────────────────────────────

/**
 * Remove a car from the compare list and broadcast the change.
 * Centralises the logic previously duplicated in CompareTable,
 * MobileCompareTable, and EmptyCompare.
 *
 * @param {string} carId - The ID of the car to remove
 */
export const handleRemoveCar = (carId) => {
    compareUtils.removeFromCompare(carId);
    window.dispatchEvent(new Event("compareListUpdated"));
};

// ─── Difference Computation ──────────────────────────────────────────────────

/**
 * Compare the spec values across all provided cars and return a map indicating
 * which specs have differing values.
 *
 * @param {Array<Object>} cars - Array of car objects
 * @returns {Record<string, boolean>} Map of spec key → true if values differ
 *
 * @example
 *   computeDifferences([carA, carB])
 *   // => { make: false, model: true, year: true, price: true, ... }
 */
export const computeDifferences = (cars) => {
    if (!cars || cars.length < 2) return {};

    const diffs = {};

    for (const key of allSpecKeys) {
        const values = cars.map((car) => car[key]);
        const firstValue = values[0];
        diffs[key] = values.some((v) => v !== firstValue);
    }

    // Features comparison — true if the sets of features differ between any cars
    const featureSets = cars.map((car) =>
        (car.features || []).slice().sort().join(",")
    );
    diffs.features = featureSets.some((set) => set !== featureSets[0]);

    return diffs;
};

// ─── Winner Computation ──────────────────────────────────────────────────────

/**
 * Determines the "winner" car for specific numeric/comparable specs.
 *
 * Winner rules:
 *  - price    → lowest is best
 *  - mileage  → lowest is best
 *  - year     → highest (newest) is best
 *  - seats    → highest is best
 *  - features → most features is best
 *
 * @param {Array<Object>} cars - Array of car objects
 * @returns {Record<string, string|null>} Map of spec key → winning car's ID,
 *          or null if there's a tie or not enough data.
 *
 * @example
 *   computeWinners([carA, carB])
 *   // => { price: "car-1", mileage: "car-2", year: "car-1", ... }
 */
export const computeWinners = (cars) => {
    if (!cars || cars.length < 2) return {};

    const winners = {};

    /**
     * Find the winner for a given key using a comparator.
     * @param {string} key - The car property to compare
     * @param {"lowest"|"highest"} direction - Whether lower or higher is better
     */
    const findWinner = (key, direction) => {
        const validCars = cars.filter(
            (car) => car[key] != null && car[key] !== undefined
        );
        if (validCars.length < 2) {
            winners[key] = null;
            return;
        }

        const sorted = [...validCars].sort((a, b) =>
            direction === "lowest" ? a[key] - b[key] : b[key] - a[key]
        );

        // Check for tie between first and second
        if (sorted[0][key] === sorted[1][key]) {
            winners[key] = null;
        } else {
            winners[key] = sorted[0].id;
        }
    };

    findWinner("price", "lowest");
    findWinner("mileage", "lowest");
    findWinner("year", "highest");
    findWinner("seats", "highest");

    // Features winner — car with the most features
    const featureCounts = cars.map((car) => ({
        id: car.id,
        count: (car.features || []).length,
    }));
    const sortedByFeatures = [...featureCounts].sort(
        (a, b) => b.count - a.count
    );
    if (
        sortedByFeatures.length >= 2 &&
        sortedByFeatures[0].count !== sortedByFeatures[1].count
    ) {
        winners.features = sortedByFeatures[0].id;
    } else {
        winners.features = null;
    }

    return winners;
};

// ─── Display Helpers ─────────────────────────────────────────────────────────

/**
 * Build a display title for a car, falling back to year/make/model.
 * @param {Object} car
 * @returns {string}
 */
export const getCarTitle = (car) => {
    return car.title || `${car.year} ${car.make} ${car.model}`;
};

/**
 * Maximum number of cars allowed in a comparison.
 */
export const MAX_COMPARE_CARS = 3;
