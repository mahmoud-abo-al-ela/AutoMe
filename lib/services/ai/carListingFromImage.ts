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
import { textPart } from "@/lib/ai/provider/types";
import type { PreparedImage } from "@/lib/services/ai/image";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";

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

/** Photos of one car read together; see extractCarListing. */
export const MAX_LISTING_PHOTOS = MAX_AI_LISTING_PHOTOS;

/**
 * The year inside the generation the model named, whichever way round it
 * wrote the range. The prompt asks for that; this makes it so.
 */
export function yearWithinGeneration<T extends { year: number; yearFrom: number; yearTo: number }>(car: T): T {
  const from = Math.min(car.yearFrom, car.yearTo);
  const to = Math.max(car.yearFrom, car.yearTo);
  return { ...car, yearFrom: from, yearTo: to, year: Math.min(Math.max(car.year, from), to) };
}

/**
 * Up to MAX_LISTING_PHOTOS photos of the same car, in one call: a rear badge
 * or a dashboard names the model where a front view only shows the shape.
 * One call, so one ledger row — the dealer is charged per car either way.
 *
 * The images are prepared (validated, sniffed) by the caller, so an unusable
 * upload is refused before anything is streamed or spent.
 */
export async function extractCarListing(
  images: PreparedImage[],
  ctx: AiCallerContext,
  options: ExtractOptions = {}
): Promise<CarListingDraft> {
  const extraction = await generateStructured({
    feature: AI_FEATURES.carListingFromImage,
    task: "vision",
    parts: [...images.map((image) => image.part), textPart(carListingPrompt.text)],
    schema: carListingSchema,
    promptVersion: carListingPrompt.version,
    ctx,
    // In order: the same photos in another order are another request.
    cacheBytes: Buffer.concat(images.map((image) => image.bytes)),
    // The schema does the constraining; measured ~2000 default thinking tokens
    // against ~270 at "low", with the same fields back.
    thinking: "low",
    // Two languages of copy plus what it read: 2,000–3,400 tokens measured,
    // and a reply cut off at the default 4,096 is unreadable JSON.
    maxOutputTokens: 8192,
    onProgress: options.onProgress,
    timeoutMs: options.timeoutMs,
    budgetMs: options.budgetMs,
    firstTokenTimeoutMs: options.firstTokenTimeoutMs,
  });

  const featuresEn = cleanFeatures(extraction.featuresEn);
  return {
    ...yearWithinGeneration(extraction),
    featuresEn,
    featuresAr: cleanFeatures(extraction.featuresAr),
    features: featuresEn,
    title: extraction.titleEn,
    description: extraction.descriptionEn,
  };
}
