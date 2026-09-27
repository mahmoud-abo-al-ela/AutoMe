import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { listingCoachPrompt } from "@/lib/ai/prompts/listing-coach";
import { listingCoachSchema } from "@/lib/ai/schemas/listing-coach";
import { textPart } from "@/lib/ai/provider/gemini";
import type { ListingIssueCode } from "@/lib/services/car/listing-quality";

/** The listing the advice is about, in the dashboard's language. */
export interface ListingToCoach {
  year: number;
  make: string;
  model: string;
  mileage: number;
  bodyType: string;
  description: string;
  features: string[];
  imageCount: number;
}

/**
 * One concrete suggestion per flagged issue, in the dashboard's language.
 * Advice for a code the rules did not flag is dropped: the rules decide what
 * is wrong, the model only says how to fix it.
 */
export async function coachListing(
  listing: ListingToCoach,
  issues: ListingIssueCode[],
  language: "en" | "ar",
  ctx: AiCallerContext
): Promise<Partial<Record<ListingIssueCode, string>>> {
  if (issues.length === 0) return {};

  const data = JSON.stringify(listing);
  const reply = await generateStructured({
    feature: AI_FEATURES.listingQualityCoach,
    task: "text",
    parts: [textPart(listingCoachPrompt.text(language, issues)), textPart(data)],
    schema: listingCoachSchema,
    promptVersion: `${listingCoachPrompt.version}.${language}`,
    ctx,
    cacheBytes: `${issues.join(",")}\0${data}`,
    thinking: "low",
    // The dealer is waiting on a button: a queued model gets 10 s to start.
    firstTokenTimeoutMs: 10_000,
  });

  const flagged = new Set(issues);
  const advice: Partial<Record<ListingIssueCode, string>> = {};
  for (const entry of reply.advice) {
    if (flagged.has(entry.code)) advice[entry.code] = entry.text.trim();
  }
  return advice;
}
