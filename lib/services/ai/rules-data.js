// Data tables for the natural-language search rules pre-filter and the sanitize
// trust boundary. Constants, not prompt prose, so they're reviewable and tunable.
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";

const CURRENT_YEAR = new Date().getFullYear();

export function addEnum(filters, field, values) {
    for (const v of values) if (!filters[field].includes(v)) filters[field].push(v);
}

// Vague quality words that must never become a `search` term (search is ANDed
// with structured filters, so a junk word guarantees zero results).
export const DISCARD_WORDS = [
    "reliable", "nice", "clean", "well maintained", "good", "beautiful", "great",
];

// Phrase -> filter mutation. Non-global regexes (stateless .test), applied by
// applyRules() before any AI call.
export const PHRASE_RULES = [
    { re: /\bfamily\b/, apply: (f) => addEnum(f, "bodyType", ["SUV", "Wagon"]) },
    { re: /\blow mileage\b/, apply: (f) => { f.maxMileage = 60000; } },
    { re: /\b(cheap|budget|affordable)\b/, apply: (f) => { f.maxPrice = 15000; } },
    { re: /\b(luxury|premium)\b/, apply: (f) => { f.minPrice = 60000; } },
    { re: /\b(new|late model)\b/, apply: (f) => { f.minYear = CURRENT_YEAR - 3; } },
    { re: /\b(first car|commuter)\b/, apply: (f) => { f.maxPrice = 20000; addEnum(f, "fuelType", ["Gasoline", "Hybrid"]); } },
];

// Lowercase word -> canonical enum value (+ common synonyms/plurals).
export const ENUM_WORDS = buildEnumWords();

// Filler words the rules pre-filter can safely ignore.
export const STOPWORDS = new Set([
    "a", "an", "the", "car", "cars", "vehicle", "vehicles", "auto", "autos",
    "with", "and", "or", "for", "me", "i", "want", "looking", "need", "some",
    "that", "please", "under", "over", "around", "any",
]);

function buildEnumWords() {
    const map = {};
    for (const v of BODY_TYPES) map[v.toLowerCase()] = { field: "bodyType", value: v };
    for (const v of FUEL_TYPES) map[v.toLowerCase()] = { field: "fuelType", value: v };
    for (const v of TRANSMISSIONS) map[v.toLowerCase()] = { field: "transmission", value: v };
    Object.assign(map, {
        automatic: { field: "transmission", value: "Automatic" },
        manual: { field: "transmission", value: "Manual" },
        electric: { field: "fuelType", value: "Electric" },
        hybrid: { field: "fuelType", value: "Hybrid" },
        diesel: { field: "fuelType", value: "Diesel" },
        petrol: { field: "fuelType", value: "Gasoline" },
        gas: { field: "fuelType", value: "Gasoline" },
        suvs: { field: "bodyType", value: "SUV" },
        sedans: { field: "bodyType", value: "Sedan" },
    });
    return map;
}
