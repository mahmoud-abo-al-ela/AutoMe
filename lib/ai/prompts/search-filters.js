// System prompt for translating a free-text car query into carSearchFiltersSchema.
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";
import { NL_SORT_KEYS } from "@/lib/validations/schemas";

const list = (arr) => arr.map((v) => `"${v}"`).join(", ");

// Bump this suffix (and the cache key in the service) whenever the prompt changes.
export const SEARCH_FILTERS_PROMPT_VERSION = "v1";

export const SEARCH_FILTERS_PROMPT = `You convert a car-shopping phrase into a structured filter object for a used-car marketplace. Output only the schema fields.

Vocabulary (use these exact values):
- bodyType: [${list(BODY_TYPES)}]
- fuelType: [${list(FUEL_TYPES)}]
- transmission: [${list(TRANSMISSIONS)}]
- sortBy: one of [${list(NL_SORT_KEYS)}] or null

Field rules:
- make: manufacturer names the user named, snapped to their real form ("mercedes" -> "Mercedes-Benz"). [] if none.
- minPrice/maxPrice: USD integers. "under 30k" -> maxPrice 30000. "over 50k" -> minPrice 50000.
- minYear/maxYear: 4-digit years. "2018 to 2022" -> minYear 2018, maxYear 2022. "newer than 2020" -> minYear 2020.
- minMileage/maxMileage: integer miles. "under 60k miles" -> maxMileage 60000.
- search: EXACTLY ONE model name (e.g. "Corolla"), or null. NEVER a body type, colour, adjective, or any word you could not map.
- interpretation: one short human sentence describing what you understood.
- unmapped: every word you could NOT map to a field above.
- confidence: 0..1.

Hard rules:
- Every word maps to a concrete field OR goes into "unmapped". Never invent filters that were not asked for.
- Vague quality words ("reliable", "nice", "clean", "well maintained", "good", "beautiful") are NOT filters -> put them in "unmapped", never in "search".
- Prefer ranges over "search". "search" is a single model name only; when unsure, use null.
- If the phrase is meaningless or nothing maps, return empty arrays / nulls and confidence below 0.35.`;
