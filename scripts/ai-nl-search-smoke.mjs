// Golden-file smoke for the PURE natural-language search logic — no Gemini call,
// so it's free to run and deterministic. The live model fixtures (prompt quality)
// are exercised once the pipeline is wired (search action).
//
// Run: node --experimental-loader ./scripts/_alias-loader.mjs scripts/ai-nl-search-smoke.mjs
// The loader maps "@/" to the repo root and treats lib/*.js as ES modules.
// Import the pure modules directly (not the service barrel) so this stays
// DB-free: the barrel also exports metering/quota, which pull in @/lib/prisma.
import { applyRules } from "@/lib/services/ai/rules.js";
import { sanitizeFilters } from "@/lib/services/ai/normalize.js";
import { carSearchFiltersSchema, nlSearchQuerySchema } from "@/lib/validations/schemas.js";
import { SEARCH_FILTERS_PROMPT } from "@/lib/ai/prompts/search-filters.js";

let pass = 0;
let fail = 0;
function check(name, cond, got) {
    if (cond) {
        pass++;
        console.log(`  ✓ ${name}`);
    } else {
        fail++;
        console.log(`  ✗ ${name} — got ${JSON.stringify(got)}`);
    }
}

// --- Rules pre-filter (resolves without an AI call) ---
const cheapSuv = applyRules("cheap suv");
check(
    "cheap suv -> rules (maxPrice 15000, bodyType SUV)",
    cheapSuv && cheapSuv.filters.maxPrice === 15000 && cheapSuv.filters.bodyType.join() === "SUV",
    cheapSuv
);
check("cheap reliable first car -> defers (leftover word)", applyRules("cheap reliable first car") === null);
check("family SUV under 30k -> defers (digit)", applyRules("family SUV under 30k, automatic, low mileage") === null);
check("asdfghjkl -> defers", applyRules("asdfghjkl") === null);

// --- sanitizeFilters (the trust boundary) ---
const swapped = sanitizeFilters(
    { minPrice: 30000, maxPrice: 5000, minYear: 3000, maxMileage: -10, bodyType: ["SUV", "Spaceship"], confidence: 0.9 },
    { rawQuery: "t" }
).filters;
check(
    "clamps + swaps inverted range + drops off-vocab enum",
    swapped.minPrice === 5000 && swapped.maxPrice === 30000 && swapped.maxMileage === 0 && swapped.bodyType.join() === "SUV",
    swapped
);
check(
    "low confidence -> plain-search fallback",
    sanitizeFilters({ bodyType: ["SUV"], confidence: 0.1 }, { rawQuery: "something nice" }).filters.search === "something nice"
);
check(
    "discard word never becomes a search term",
    sanitizeFilters({ search: "reliable", bodyType: ["SUV"], confidence: 0.9 }, { rawQuery: "x" }).filters.search === null
);
check(
    "snaps known make, drops unknown",
    sanitizeFilters({ make: ["toyota", "ferrari"], confidence: 0.9 }, { rawQuery: "x", knownMakes: ["Toyota", "BMW"] }).filters.make.join() === "Toyota"
);

// --- Schema contract ---
check(
    "valid filters parse",
    carSearchFiltersSchema.safeParse({
        make: ["Toyota"], bodyType: ["SUV"], fuelType: [], transmission: [],
        minPrice: null, maxPrice: 30000, minYear: null, maxYear: null,
        minMileage: null, maxMileage: 60000, sortBy: "newest", search: "Corolla",
        interpretation: "x", unmapped: [], confidence: 0.8,
    }).success
);
check("200+ char query rejected before any API call", !nlSearchQuerySchema.safeParse({ query: "x".repeat(201) }).success);

// --- Prompt is built from the live vocabulary ---
check(
    "prompt embeds vocabulary (SUV / Automatic / sort keys)",
    SEARCH_FILTERS_PROMPT.includes('"SUV"') && SEARCH_FILTERS_PROMPT.includes('"Automatic"') && SEARCH_FILTERS_PROMPT.includes('"mileageAsc"')
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
