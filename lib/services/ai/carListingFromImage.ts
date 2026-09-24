import {
  generateStructured,
  type AiCallerContext,
  type AiProgressEvent,
} from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { carListingPrompt } from "@/lib/ai/prompts/car-listing";
import {
  carListingSchema,
  type CarListingExtraction,
} from "@/lib/ai/schemas/car-listing";
import { textPart } from "@/lib/ai/provider/gemini";
import type { PreparedImage } from "@/lib/services/ai/image";

/** Every field the model writes, in schema order — the denominator of progress. */
export const CAR_LISTING_FIELDS = Object.keys(carListingSchema.shape);

/**
 * How many fields a partial reply has started. The response schema makes the
 * model emit each field as a top-level `"key":`, so a key appearing is a real
 * signal that the model has reached it — not an estimate.
 */
export function countWrittenFields(partialJson: string): number {
  return CAR_LISTING_FIELDS.filter((key) => partialJson.includes(`"${key}"`)).length;
}

/**
 * What the car form consumes: the extraction plus `title`, `description` and
 * `features` — the English variants under their source-of-record names. The
 * `Car` table keeps those as the columns everything already reads, and the
 * bilingual columns sit beside them, so the draft carries both shapes and the
 * form does not have to know which is which.
 */
export interface CarListingDraft extends CarListingExtraction {
  features: string[];
  title: string;
  description: string;
}

/**
 * The form edits features as one comma-separated line, so a comma inside a
 * single feature would split it in two on the way back.
 */
function cleanFeatures(features: string[]): string[] {
  return features.map((f) => f.replace(/[,،]/g, " ").trim()).filter(Boolean);
}

export interface ExtractOptions {
  /** Real progress; also switches the provider call to streaming. */
  onProgress?: (event: AiProgressEvent) => void;
  /** Per-attempt and total ceilings, when the caller can afford longer waits. */
  timeoutMs?: number;
  budgetMs?: number;
  /** See GenerateStructuredInput.firstTokenTimeoutMs. */
  firstTokenTimeoutMs?: number;
}

/**
 * The image is prepared (validated, sniffed) by the caller, so an unusable
 * upload is refused before anything is streamed or spent.
 */
export async function extractCarListing(
  image: PreparedImage,
  ctx: AiCallerContext,
  options: ExtractOptions = {}
): Promise<CarListingDraft> {
  const extraction = await generateStructured({
    feature: AI_FEATURES.carListingFromImage,
    task: "vision",
    parts: [image.part, textPart(carListingPrompt.text)],
    schema: carListingSchema,
    promptVersion: carListingPrompt.version,
    ctx,
    cacheBytes: image.bytes,
    // The schema does the constraining; measured ~2000 default thinking tokens
    // against ~270 at "low", with the same fields back.
    thinking: "low",
    onProgress: options.onProgress,
    timeoutMs: options.timeoutMs,
    budgetMs: options.budgetMs,
    firstTokenTimeoutMs: options.firstTokenTimeoutMs,
  });

  const featuresEn = cleanFeatures(extraction.featuresEn);
  return {
    ...extraction,
    featuresEn,
    featuresAr: cleanFeatures(extraction.featuresAr),
    features: featuresEn,
    title: extraction.titleEn,
    description: extraction.descriptionEn,
  };
}
