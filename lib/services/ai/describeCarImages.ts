import { createHash } from "node:crypto";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { imageAltsPrompt } from "@/lib/ai/prompts/image-alts";
import { imageAltsSchema } from "@/lib/ai/schemas/image-alts";
import { imagePart, textPart, type AiPart } from "@/lib/ai/provider/gemini";
import type { ImageAlt } from "@/lib/utils/image-alts";

export interface PhotoToDescribe {
  url: string;
  bytes: Buffer;
  mimeType: string;
}

/**
 * Write alt text for a car's photos in one call.
 *
 * Returns a map from URL to alt text for every photo the model described;
 * a photo it skipped is simply absent, and keeps its fallback alt text.
 */
export async function describeCarImages(
  car: { year: number; make: string; model: string },
  photos: PhotoToDescribe[],
  ctx: AiCallerContext
): Promise<Record<string, ImageAlt>> {
  if (photos.length === 0) return {};

  const parts: AiPart[] = [
    ...photos.map((photo) => imagePart(photo.bytes.toString("base64"), photo.mimeType)),
    textPart(imageAltsPrompt.text(car, photos.length)),
  ];

  // Keyed on the car as well as the bytes: the prompt names the car, so the
  // same photo under a corrected make must not be served the old description.
  const cacheKey = createHash("sha256");
  cacheKey.update(`${car.year}\0${car.make}\0${car.model}`);
  for (const photo of photos) cacheKey.update(photo.bytes);

  const reply = await generateStructured({
    feature: AI_FEATURES.carImageAltText,
    task: "visionFast",
    parts,
    schema: imageAltsSchema,
    promptVersion: imageAltsPrompt.version,
    ctx,
    cacheBytes: cacheKey.digest("hex"),
    thinking: "low",
    // Runs after the save has answered, inside the same function's time limit.
    budgetMs: 45_000,
    firstTokenTimeoutMs: 10_000,
  });

  const described: Record<string, ImageAlt> = {};
  for (const entry of reply.images) {
    const photo = photos[entry.index];
    // An index the model invented has no photo to attach to.
    if (!photo) continue;
    described[photo.url] = { en: entry.en.trim(), ar: entry.ar.trim() };
  }
  return described;
}
