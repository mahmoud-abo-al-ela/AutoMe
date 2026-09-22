import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { imageSearchPrompt } from "@/lib/ai/prompts/image-search";
import { imageSearchSchema } from "@/lib/ai/schemas/image-search";
import { textPart } from "@/lib/ai/provider/gemini";
import { prepareImage } from "@/lib/services/ai/image";

/**
 * Filters the hero photo search produces. Every field is optional by omission:
 * a field the model could not determine is dropped rather than sent empty, so
 * the caller can build a URL without having to re-check for "".
 */
export interface ImageSearchFilters {
  make?: string;
  bodyType?: string;
  color?: string;
  confidence: number;
}

function omitEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function extractSearchFilters(
  file: File,
  ctx: AiCallerContext
): Promise<ImageSearchFilters> {
  const image = await prepareImage(file);

  const extraction = await generateStructured({
    feature: AI_FEATURES.searchFiltersFromImage,
    task: "visionFast",
    parts: [image.part, textPart(imageSearchPrompt.text)],
    schema: imageSearchSchema,
    promptVersion: imageSearchPrompt.version,
    ctx,
    cacheBytes: image.bytes,
  });

  return {
    make: omitEmpty(extraction.make),
    bodyType: omitEmpty(extraction.bodyType),
    color: omitEmpty(extraction.color),
    confidence: extraction.confidence,
  };
}
