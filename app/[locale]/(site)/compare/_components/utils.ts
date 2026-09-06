import { compareUtils } from "@/lib/utils";
import { formatCarPrice } from "@/lib/utils/currency";
import { formatMileage as formatMileageKm } from "@/lib/utils/units";
import type {
    CompareCar,
    CompareDifferences,
    CompareWinners,
    SpecKey,
    SpecValue,
} from "../_lib/compare-types";

// ─── Formatting Utilities ────────────────────────────────────────────────────

/** Format a numeric price as an EGP currency string, e.g. "EGP 25,000". */
export const formatPrice = (price: number): string => formatCarPrice(price);

/** Format a numeric mileage value in kilometres, e.g. "45,000 km". */
export const formatMileage = (mileage: number): string =>
    formatMileageKm(mileage);

/**
 * Cell formatters for the spec table. A spec's `format` receives whatever
 * `car[key]` holds, so these coerce; `price` and `mileage` are non-nullable
 * numeric columns, so the coercion never actually sees a null in practice.
 */
const formatPriceCell = (value: SpecValue): string => formatPrice(Number(value));
const formatMileageCell = (value: SpecValue): string =>
    formatMileage(Number(value));

// ─── Spec Category Definitions ───────────────────────────────────────────────

/** One row of the comparison table. */
export interface SpecDefinition {
    key: SpecKey;
    format?: (value: SpecValue) => string;
}

/** A tab of the comparison table. */
export interface SpecCategory {
    id: string;
    specs: SpecDefinition[];
}

/**
 * Shared specification categories used by both desktop and mobile compare views.
 * Each category contains an array of spec definitions with a data key and an
 * optional format function. The visible label comes from carAttributes.fields,
 * keyed by that same data key, so the label and the column cannot drift apart.
 */
export const specCategories: SpecCategory[] = [
    {
        id: "basic",
        specs: [
            { key: "make" },
            { key: "model" },
            { key: "year" },
            { key: "price", format: formatPriceCell },
            { key: "bodyType" },
        ],
    },
    {
        id: "performance",
        specs: [
            { key: "mileage", format: formatMileageCell },
            { key: "fuelType" },
            { key: "transmission" },
            { key: "color" },
            { key: "seats" },
        ],
    },
];

/**
 * Flat list of all spec keys across every category — useful for iteration.
 */
export const allSpecKeys: SpecKey[] = specCategories.flatMap((cat) =>
    cat.specs.map((s) => s.key)
);

// ─── Car Removal Handler ─────────────────────────────────────────────────────

/**
 * Remove a car from the compare list and broadcast the change.
 * Centralises the logic previously duplicated in CompareTable,
 * MobileCompareTable, and EmptyCompare.
 */
export const handleRemoveCar = (carId: string): void => {
    compareUtils.removeFromCompare(carId);
    window.dispatchEvent(new Event("compareListUpdated"));
};

// ─── Difference Computation ──────────────────────────────────────────────────

/**
 * Compare the spec values across all provided cars and return a map indicating
 * which specs have differing values. Keyed by spec key plus "features".
 *
 * @example
 *   computeDifferences([carA, carB])
 *   // => { make: false, model: true, year: true, price: true, ... }
 */
export const computeDifferences = (
    cars: CompareCar[]
): CompareDifferences => {
    if (!cars || cars.length < 2) return {};

    const diffs: CompareDifferences = {};

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

/** The specs that have a "best" value; everything else is descriptive. */
type NumericSpecKey = "price" | "mileage" | "year" | "seats";

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
 * Returns a map of spec key → winning car's ID, or null on a tie or when there
 * is not enough data.
 *
 * @example
 *   computeWinners([carA, carB])
 *   // => { price: "car-1", mileage: "car-2", year: "car-1", ... }
 */
export const computeWinners = (
    cars: CompareCar[]
): CompareWinners => {
    if (!cars || cars.length < 2) return {};

    const winners: CompareWinners = {};

    const findWinner = (key: NumericSpecKey, direction: "lowest" | "highest") => {
        const entries = cars
            .map((car) => ({ id: car.id, value: car[key] }))
            .filter((entry): entry is { id: string; value: number } =>
                entry.value != null
            );

        if (entries.length < 2) {
            winners[key] = null;
            return;
        }

        const sorted = [...entries].sort((a, b) =>
            direction === "lowest" ? a.value - b.value : b.value - a.value
        );

        // Check for tie between first and second
        winners[key] = sorted[0].value === sorted[1].value ? null : sorted[0].id;
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

/** Build a display title for a car, falling back to year/make/model. */
export const getCarTitle = (car: CompareCar): string =>
    car.title || `${car.year} ${car.make} ${car.model}`;

/**
 * Maximum number of cars allowed in a comparison.
 */
export const MAX_COMPARE_CARS = 3;
