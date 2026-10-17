import { describe, it, expect } from "vitest";
import type { ZodType } from "zod";
import { toJsonSchema } from "@/lib/utils/json-schema";
import { carListingSchema } from "@/lib/ai/schemas/car-listing";
import { imageAltsSchema } from "@/lib/ai/schemas/image-alts";
import { imageSearchSchema } from "@/lib/ai/schemas/image-search";
import { listingCoachSchema } from "@/lib/ai/schemas/listing-coach";
import { listingQaSchema } from "@/lib/ai/schemas/listing-qa";
import { listingTranslationSchema } from "@/lib/ai/schemas/listing-translation";
import { chatTranslationSchema } from "@/lib/ai/schemas/chat-translation";
import { chatModerationSchema } from "@/lib/ai/schemas/chat-moderation";
import { weeklySummarySchema } from "@/lib/ai/schemas/weekly-summary";

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
    const json = toJsonSchema(schema);
    expect(enumArraysWithMaxItems(json)).toEqual([]);
  });
});
