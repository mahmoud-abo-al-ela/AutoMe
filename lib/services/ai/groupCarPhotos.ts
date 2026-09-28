import { createHash } from "node:crypto";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { photoGroupingPrompt } from "@/lib/ai/prompts/photo-grouping";
import { photoGroupingSchema, type PhotoGroupingReply } from "@/lib/ai/schemas/photo-grouping";
import { textPart } from "@/lib/ai/provider/types";
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
 * `readWith` only ever from the group's own photos. The label is shown only to
 * the dealer who took the photos and is never stored, so it is trimmed, not
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

    const chosen = [...new Set(car.readWith)].filter((i) => own.has(i));
    const readWith = (chosen.length > 0 ? chosen : photos).slice(0, MAX_AI_LISTING_PHOTOS);
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
 * tokens for no better answer. On the fast vision chain — Google first — for
 * the same reason: CodeCraft charges a fixed ~4.4k tokens an image.
 */
export async function groupCarPhotos(images: PreparedImage[], ctx: AiCallerContext): Promise<PhotoGroup[]> {
  if (images.length === 1) return [{ label: "", photos: [0], readWith: [0] }];

  const key = createHash("sha256");
  for (const image of images) key.update(image.bytes);

  const reply = await generateStructured({
    feature: AI_FEATURES.carPhotoGrouping,
    task: "visionFast",
    parts: [...images.map((image) => image.part), textPart(photoGroupingPrompt.text(images.length))],
    schema: photoGroupingSchema,
    promptVersion: photoGroupingPrompt.version,
    ctx,
    cacheBytes: key.digest("hex"),
    thinking: "low",
    budgetMs: 120_000,
    firstTokenTimeoutMs: 30_000,
  });

  return normalizeGrouping(reply, images.length);
}
