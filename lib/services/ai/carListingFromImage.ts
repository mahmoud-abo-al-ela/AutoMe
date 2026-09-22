import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { carListingPrompt } from "@/lib/ai/prompts/car-listing";
import {
  carListingSchema,
  type CarListingExtraction,
} from "@/lib/ai/schemas/car-listing";
import { textPart } from "@/lib/ai/provider/gemini";
import { prepareImage } from "@/lib/services/ai/image";

/** What the car form consumes: the extraction with `features` always an array. */
export interface CarListingDraft extends Omit<CarListingExtraction, "features"> {
  features: string[];
}

/** The model may answer with an array or a comma/newline separated string. */
function toFeatureList(features: string[] | string): string[] {
  if (Array.isArray(features)) {
    return features.map((f) => f.trim()).filter(Boolean);
  }

  return features
    .split(/[,\n]/)
    .map((f) => f.trim())
    .filter(Boolean);
}

export async function extractCarListing(
  file: File,
  ctx: AiCallerContext
): Promise<CarListingDraft> {
  const image = await prepareImage(file);

  const extraction = await generateStructured({
    feature: AI_FEATURES.carListingFromImage,
    task: "vision",
    parts: [image.part, textPart(carListingPrompt.text)],
    schema: carListingSchema,
    promptVersion: carListingPrompt.version,
    ctx,
    cacheBytes: image.bytes,
  });

  return { ...extraction, features: toFeatureList(extraction.features) };
}
