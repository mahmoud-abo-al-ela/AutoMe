// Converts Zod schemas to the JSON Schema shape Gemini accepts as responseSchema.
import { zodToJsonSchema } from "zod-to-json-schema";

// Cache per Zod schema. zod@3 has no native z.toJSONSchema() (that landed in
// zod 4), and @google/genai ships zod / zod-to-json-schema only as
// devDependencies, so the SDK can't convert a Zod schema at runtime — we do it
// here, once per schema.
const cache = new WeakMap();

/**
 * Convert a Zod schema to the JSON Schema Gemini expects on `config.responseSchema`.
 *
 * - target "openApi3" avoids draft-specific keywords Gemini ignores.
 * - $refStrategy "none" inlines everything: keeps the schema flat, which is cheap
 *   insurance against Gemini rejecting large or deeply nested schemas.
 */
export function toGeminiSchema(zodSchema) {
    if (!cache.has(zodSchema)) {
        cache.set(
            zodSchema,
            zodToJsonSchema(zodSchema, { target: "openApi3", $refStrategy: "none" })
        );
    }
    return cache.get(zodSchema);
}
