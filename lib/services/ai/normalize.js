// Pure, I/O-free cleaning for natural-language search. sanitizeFilters() is the
// real trust boundary: nothing reaches a where clause without passing through it.
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";
import { NL_SORT_KEYS } from "@/lib/validations/schemas";
import { DISCARD_WORDS } from "./rules-data";

const CURRENT_YEAR = new Date().getFullYear();
const MULTI_FIELDS = ["make", "bodyType", "fuelType", "transmission"];

// Structured filters in the shape hooks/cars-page-filters.js consumes.
export function emptyFilters() {
    return {
        make: [], bodyType: [], fuelType: [], transmission: [],
        color: null, minSeats: null,
        minPrice: null, maxPrice: null,
        minYear: null, maxYear: null,
        minMileage: null, maxMileage: null,
        sortBy: null, search: null,
    };
}

// The full envelope the UI banner reads (source is added by the caller).
export function envelope(filters, { interpretation = "", unmapped = [], confidence = 0 } = {}) {
    return { filters, interpretation, unmapped, confidence };
}

/**
 * Clean AI (or rules) output before it reaches a where clause. Pure.
 *
 * Clamps numbers non-negative, clamps years, swaps inverted ranges, drops
 * off-vocabulary enum values, snaps makes against the known DB list when
 * provided, caps arrays and the search term, and falls back to plain search
 * ({ search: rawQuery } — exactly today's behaviour) when nothing usable remains
 * or confidence is too low. The single `search` term is never an unmapped word:
 * where.OR is ANDed with structured filters, so a junk term guarantees zero hits.
 *
 * @param {object} raw - carSearchFiltersSchema-shaped object (AI or rules output)
 * @param {object} opts
 * @param {string} opts.rawQuery - original query, used as the plain-search fallback
 * @param {string[]|null} [opts.knownMakes] - canonical DB makes for case snapping
 */
export function sanitizeFilters(raw, { rawQuery, knownMakes = null } = {}) {
    const filters = emptyFilters();
    const confidence = clamp01(raw?.confidence);
    const unmapped = Array.isArray(raw?.unmapped) ? raw.unmapped.slice(0, 10) : [];

    filters.bodyType = keepEnum(raw?.bodyType, BODY_TYPES);
    filters.fuelType = keepEnum(raw?.fuelType, FUEL_TYPES);
    filters.transmission = keepEnum(raw?.transmission, TRANSMISSIONS);
    filters.make = snapMakes(raw?.make, knownMakes);

    [filters.minPrice, filters.maxPrice] = orderRange(toInt(raw?.minPrice, 0), toInt(raw?.maxPrice, 0));
    [filters.minYear, filters.maxYear] = orderRange(clampYear(toInt(raw?.minYear)), clampYear(toInt(raw?.maxYear)));
    [filters.minMileage, filters.maxMileage] = orderRange(toInt(raw?.minMileage, 0), toInt(raw?.maxMileage, 0));

    filters.sortBy = NL_SORT_KEYS.includes(raw?.sortBy) ? raw.sortBy : null;

    const term = typeof raw?.search === "string" ? raw.search.trim() : "";
    filters.search = term && term.length <= 40 && !isDiscard(term) ? term : null;

    const color = typeof raw?.color === "string" ? raw.color.trim() : "";
    filters.color = color && color.length <= 30 && !isDiscard(color) ? color : null;
    filters.minSeats = clampSeats(toInt(raw?.minSeats));

    if (confidence < 0.35 || isEmpty(filters)) {
        return envelope({ ...emptyFilters(), search: rawQuery }, { unmapped, confidence });
    }

    const interpretation = typeof raw?.interpretation === "string" ? raw.interpretation : "";
    return envelope(filters, { interpretation, unmapped, confidence });
}

function clamp01(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

function toInt(v, min = null) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return null;
    return min !== null && n < min ? min : n;
}

function clampYear(n) {
    if (n === null) return null;
    return Math.min(CURRENT_YEAR + 1, Math.max(1900, n));
}

function clampSeats(n) {
    if (n === null) return null;
    return Math.min(12, Math.max(1, n));
}

function orderRange(min, max) {
    return min !== null && max !== null && min > max ? [max, min] : [min, max];
}

function keepEnum(arr, vocab) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const v of arr) if (vocab.includes(v) && !out.includes(v)) out.push(v);
    return out.slice(0, 5);
}

function snapMakes(arr, knownMakes) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const raw of arr) {
        if (typeof raw !== "string" || !raw.trim()) continue;
        let value = raw.trim();
        if (knownMakes) {
            const hit = knownMakes.find((m) => m.toLowerCase() === value.toLowerCase());
            if (!hit) continue; // unknown make -> drop (possible hallucination)
            value = hit;
        }
        if (!out.includes(value)) out.push(value);
    }
    return out.slice(0, 5);
}

function isDiscard(term) {
    return DISCARD_WORDS.includes(term.toLowerCase());
}

function isEmpty(f) {
    return (
        MULTI_FIELDS.every((k) => f[k].length === 0) &&
        f.minPrice === null && f.maxPrice === null &&
        f.minYear === null && f.maxYear === null &&
        f.minMileage === null && f.maxMileage === null &&
        f.minSeats === null && !f.color &&
        !f.search && !f.sortBy
    );
}
