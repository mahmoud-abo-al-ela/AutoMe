import type { Locale } from "@/i18n/routing";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { listingTranslationPrompt } from "@/lib/ai/prompts/listing-translation";
import {
  listingTranslationSchema,
  type ListingTranslation,
} from "@/lib/ai/schemas/listing-translation";
import { textPart } from "@/lib/ai/provider/gemini";

export type ListingText = ListingTranslation;

/**
 * Write a listing's text in the other language.
 *
 * Metered and cached through the one AI client like every other call; the
 * source text and direction are the cache key, so saving the same listing
 * twice without edits does not spend a second request.
 */
export async function translateListing(
  source: ListingText,
  from: Locale,
  ctx: AiCallerContext
): Promise<ListingText> {
  const listing = JSON.stringify(source);
  const translated = await generateStructured({
    feature: AI_FEATURES.listingTranslation,
    task: "text",
    parts: [
      textPart(from === "en" ? listingTranslationPrompt.toArabic : listingTranslationPrompt.toEnglish),
      textPart(listing),
    ],
    schema: listingTranslationSchema,
    promptVersion: `${listingTranslationPrompt.version}.${from}`,
    ctx,
    cacheBytes: listing,
    thinking: "low",
    // Inside a save with a 45 s budget: a queued model gets 10 s to start
    // before the next one (Gemma last) is tried.
    firstTokenTimeoutMs: 10_000,
  });

  return {
    title: translated.title.trim(),
    description: translated.description.trim(),
    // The form edits features as one comma-separated line; see cleanFeatures
    // in carListingFromImage.
    features: translated.features.map((f) => f.replace(/[,،]/g, " ").trim()).filter(Boolean),
  };
}
