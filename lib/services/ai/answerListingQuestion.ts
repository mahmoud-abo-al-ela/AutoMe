import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { citationsHold, type ListingFacts, type ListingFactKey } from "@/lib/ai/grounding";
import { listingQaPrompt } from "@/lib/ai/prompts/listing-qa";
import { listingQaSchema } from "@/lib/ai/schemas/listing-qa";
import { textPart } from "@/lib/ai/provider/types";
import { questionKey } from "@/lib/utils/question-key";

/** What a buyer is shown: an answer the listing backs, or nothing. */
export type ListingAnswer =
  | { grounded: true; answer: string; fieldsUsed: ListingFactKey[] }
  | { grounded: false };

/**
 * Answer a buyer's question from one listing's facts, or decline.
 *
 * The model's own `grounded` flag is necessary but not sufficient: an answer
 * is shown only when it also cites at least one fact and every cited fact is
 * one this listing actually has. Anything else is a decline, and the caller
 * shows fixed wording for it — the model's text is never shown for a decline,
 * so a manipulated "I don't know, but visit…" has nowhere to appear.
 */
export async function answerListingQuestion(
  question: string,
  facts: ListingFacts,
  language: "en" | "ar",
  ctx: AiCallerContext
): Promise<ListingAnswer> {
  const record = JSON.stringify(facts);
  const reply = await generateStructured({
    feature: AI_FEATURES.listingQA,
    // A buyer is waiting on the page: the fast chain, not the dealer one.
    task: "textFast",
    parts: [
      textPart(listingQaPrompt.text(language)),
      textPart(record),
      textPart(JSON.stringify(question)),
    ],
    schema: listingQaSchema,
    promptVersion: `${listingQaPrompt.version}.${language}`,
    ctx,
    // The record is in the key, so an edited listing is never answered from
    // its old self, and two listings never share an answer. A re-asked
    // question costs the dealer nothing; the model still sees what was typed.
    cacheBytes: `${record}\0${questionKey(question)}`,
    thinking: "low",
    temperature: 0,
    // A buyer is waiting on the page: a queued model gets 15 s to start.
    firstTokenTimeoutMs: 15_000,
  });

  const answer = reply.answer.trim();
  if (!reply.grounded || !answer || !citationsHold(facts, reply.fieldsUsed)) {
    return { grounded: false };
  }
  return { grounded: true, answer, fieldsUsed: [...new Set(reply.fieldsUsed)] };
}
