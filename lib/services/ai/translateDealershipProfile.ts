import type { Locale } from "@/i18n/routing";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { dealershipProfilePrompt } from "@/lib/ai/prompts/dealership-profile";
import { dealershipProfileSchema } from "@/lib/ai/schemas/dealership-profile";
import { textPart } from "@/lib/ai/provider/types";

/** The dealership fields translated together; a field not being translated is "". */
export interface DealershipProfileText {
  description: string;
  address: string;
}

/**
 * Write a dealership's description and/or address in the other language.
 *
 * Metered and cached through the one AI client like every other call; the
 * text and direction are the cache key, so saving the profile again without
 * touching either field spends nothing.
 */
export async function translateDealershipProfile(
  text: DealershipProfileText,
  from: Locale,
  ctx: AiCallerContext
): Promise<DealershipProfileText> {
  const source = JSON.stringify(text);
  const translated = await generateStructured({
    feature: AI_FEATURES.dealershipProfileTranslation,
    task: "text",
    parts: [
      textPart(from === "en" ? dealershipProfilePrompt.toArabic : dealershipProfilePrompt.toEnglish),
      textPart(source),
    ],
    schema: dealershipProfileSchema,
    promptVersion: `${dealershipProfilePrompt.version}.${from}`,
    ctx,
    cacheBytes: source,
    thinking: "low",
  });
  return { description: translated.description.trim(), address: translated.address.trim() };
}
