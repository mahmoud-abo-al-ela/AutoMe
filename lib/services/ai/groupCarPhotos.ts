import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { photoGroupingPrompt } from "@/lib/ai/prompts/photo-grouping";
import { photoGroupingSchema, type PhotoGroupingReply } from "@/lib/ai/schemas/photo-grouping";
import { textPart } from "@/lib/ai/provider/types";
import { importLeadModels } from "@/lib/ai/models";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";
import type { PreparedImage } from "@/lib/services/ai/image";

/** One car found in the batch; photos are 0-based positions in it. */
export interface PhotoGroup {
  label: string;
  photos: number[];
  /** Up to MAX_AI_LISTING_PHOTOS of `photos`, best for identifying the car. */
  readWith: number[];
}

const MAX_LABEL = 80;

/**
 * The model's grouping, made sound: every photo in exactly one group, in the
 * order first claimed; indexes it invented dropped; photos it left out given
 * a group each (a dealer can merge two groups, but cannot find a lost photo);
 * `readWith` only ever from the group's own photos, and as full as the car
 * allows. The label is shown only to the dealer who took the photos and is
 * never stored, so it is trimmed, not
 * scrubbed: stripping digits would turn "K5" and "3008" into nonsense.
 */
export function normalizeGrouping(reply: PhotoGroupingReply, count: number): PhotoGroup[] {
  const claimed = new Set<number>();
  const groups: PhotoGroup[] = [];

  for (const car of reply.cars) {
    const photos = car.photos.filter((i) => Number.isInteger(i) && i >= 0 && i < count && !claimed.has(i));
    const own = new Set(photos);
    if (photos.length === 0) continue;
    photos.forEach((i) => claimed.add(i));

    // The model's picks first, then the car's other photos until the read is
    // full: a pick of two from a car of three once left out the boot lid
    // reading "C 200", and the car was drafted as a GLC.
    const chosen = [...new Set(car.readWith)].filter((i) => own.has(i));
    const readWith = [...chosen, ...photos.filter((i) => !chosen.includes(i))].slice(0, MAX_AI_LISTING_PHOTOS);
    const label = car.label.trim().slice(0, MAX_LABEL);
    groups.push({ label, photos, readWith });
  }

  for (let i = 0; i < count; i++) {
    if (!claimed.has(i)) groups.push({ label: "", photos: [i], readWith: [i] });
  }
  return groups;
}

/**
 * Sort a dealer's batch of photos into cars, in one call.
 *
 * The images are small copies (the caller's job): sorting needs to tell cars
 * apart, not read their badges, and a batch of full photos would cost far more
 * tokens for no better answer. Claude Sonnet 5 sorts first — it separates
 * look-alike cars the fast models merged — with the fast vision chain behind
 * it for when it is busy.
 */
export async function groupCarPhotos(images: PreparedImage[], ctx: AiCallerContext): Promise<PhotoGroup[]> {
  if (images.length === 1) return [{ label: "", photos: [0], readWith: [0] }];

  const reply = await generateStructured({
    feature: AI_FEATURES.carPhotoGrouping,
    task: "visionFast",
    parts: [...images.map((image) => image.part), textPart(photoGroupingPrompt.text(images.length))],
    schema: photoGroupingSchema,
    promptVersion: photoGroupingPrompt.version,
    ctx,
    // Not cached: a dealer who uploads the same batch again is asking for a
    // better sort, and a cached answer — possibly the last-resort model's —
    // would hand back the same mistake for ten minutes.
    thinking: "low",
    // A batch is many images. At CodeCraft's usual 30 s an attempt, it timed
    // out on ten photos and the sort fell to Gemma, which merged two
    // different Mercedes (2026-09-29). Google busy-refuses in seconds, so the
    // long wait only ever goes to a model that is actually working.
    timeoutMs: 90_000,
    budgetMs: 150_000,
    firstTokenTimeoutMs: 30_000,
    // Measured on the same five photos of two Mercedes: Gemini 3.7 Flash
    // sorted them right; Gemma put four in one car, prompt fix or not. A
    // "busy, try again" is better than a confident wrong sort.
    skipGemma: true,
    // Claude Sonnet 5 first (see importLeadModels), the fast chain behind it.
    leadWith: importLeadModels(),
  });

  return normalizeGrouping(reply, images.length);
}
