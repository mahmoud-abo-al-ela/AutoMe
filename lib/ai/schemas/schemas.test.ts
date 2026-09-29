import { describe, it, expect } from "vitest";
import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { carListingSchema } from "@/lib/ai/schemas/car-listing";
import { imageAltsSchema } from "@/lib/ai/schemas/image-alts";
import { imageSearchSchema } from "@/lib/ai/schemas/image-search";
import { listingCoachSchema } from "@/lib/ai/schemas/listing-coach";
import { listingQaSchema } from "@/lib/ai/schemas/listing-qa";
import { listingTranslationSchema } from "@/lib/ai/schemas/listing-translation";
import { chatTranslationSchema } from "@/lib/ai/schemas/chat-translation";
import { chatModerationSchema } from "@/lib/ai/schemas/chat-moderation";
import { weeklySummarySchema } from "@/lib/ai/schemas/weekly-summary";

/**
 * Every schema is sent to every model in its chain, Gemma included — and Gemma
 * is the last resort, reached only when everything else is busy. A schema it
 * rejects fails the whole request at exactly the worst moment.
 *
 * Measured 2026-09-28: Gemma 4 answers 400 "invalid argument" to an array that
 * has both an enum of 24 values and maxItems, and accepts either one alone.
 * So no enum-bearing array carries maxItems; lengths are enforced in code.
 */
const SCHEMAS: Record<string, ZodType<unknown>> = {
  carListingSchema,
  imageAltsSchema,
  imageSearchSchema,
  listingCoachSchema,
  listingQaSchema,
  listingTranslationSchema,
  chatTranslationSchema,
  chatModerationSchema,
  weeklySummarySchema,
};

function hasEnum(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  if ("enum" in node) return true;
  return Object.values(node).some(hasEnum);
}

function enumArraysWithMaxItems(node: unknown, path = "$"): string[] {
  if (!node || typeof node !== "object") return [];
  const here =
    (node as { type?: unknown }).type === "array" &&
    "maxItems" in node &&
    hasEnum((node as { items?: unknown }).items)
      ? [path]
      : [];
  return [
    ...here,
    ...Object.entries(node).flatMap(([key, child]) => enumArraysWithMaxItems(child, `${path}.${key}`)),
  ];
}

describe("AI response schemas", () => {
  it.each(Object.entries(SCHEMAS))("%s has no enum array with maxItems (Gemma rejects it)", (_, schema) => {
    const json = zodToJsonSchema(schema, { $refStrategy: "none" });
    expect(enumArraysWithMaxItems(json)).toEqual([]);
  });
});
