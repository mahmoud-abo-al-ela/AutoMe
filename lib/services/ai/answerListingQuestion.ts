import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { citationsHold, type ListingFacts, type ListingFactKey } from "@/lib/ai/grounding";
import { listingQaPrompt } from "@/lib/ai/prompts/listing-qa";
import { listingQaSchema } from "@/lib/ai/schemas/listing-qa";
import { textPart } from "@/lib/ai/provider/types";
import { questionKey } from "@/lib/utils/question-key";
import type { Trace } from "@/lib/utils/dev-trace";

/**
 * What a buyer is shown: an answer the record backs, or a decline — with the
 * model's own wording for it when that wording passes declineText, and the
 * caller's fixed wording when it does not.
 */
export type ListingAnswer =
  | { grounded: true; answer: string; fieldsUsed: ListingFactKey[] }
  /** `offTopic`: not a question about this car at all — nothing for the dealer. */
  | { grounded: false; message?: string; offTopic?: true };

const MAX_DECLINE_CHARS = 240;

/**
 * Things a decline has no business containing, because they are what an
 * instruction planted in a listing would try to get in front of a buyer: a
 * link, a domain, an email, or a phone number (Western or Arabic-Indic).
 */
const UNSAFE_IN_DECLINE = [
  /https?:|www\./i,
  // Any word.word with a letters-only ending, not a list of known endings: a
  // decline never needs a domain, and a false positive only costs the fixed copy.
  /\b[a-z0-9-]{2,}\.[a-z]{2,}\b/i,
  /@/,
  /[0-9٠-٩][0-9٠-٩\s-]{6,}/,
];

/**
 * The model's wording for a decline, if it is safe to show; otherwise
 * nothing, and the caller falls back to fixed copy. A decline carries no
 * facts, so it only has to be short and free of anything that points a buyer
 * somewhere else.
 */
export function declineText(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_DECLINE_CHARS) return undefined;
  return UNSAFE_IN_DECLINE.some((pattern) => pattern.test(trimmed)) ? undefined : trimmed;
}

/**
 * Answer a buyer's question from one listing's facts, or decline.
 *
 * The model's own `grounded` flag is necessary but not sufficient: an answer
 * is shown only when it also cites at least one fact and every cited fact is
 * one this listing actually has. Anything else is a decline.
 *
 * A decline may carry the model's own wording — "the listing doesn't say
 * whether it's been in an accident" reads as a reply, a fixed sentence reads
 * as a wall — but only when the model itself declined, and only through
 * declineText, so a manipulated "I don't know, but visit…" is dropped. An
 * answer the model called grounded but whose citations fail is never shown in
 * any form: it may state a fact the record does not have.
 */
export async function answerListingQuestion(
  question: string,
  facts: ListingFacts,
  language: "en" | "ar",
  ctx: AiCallerContext,
  trace?: Trace
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
    // The fast chain's Google models answer in ~1 s when they are serving;
    // one silent for 6 s is queued. 15 s here left CodeCraft, behind it, too
    // little of the budget to answer (seen live: a question timed out whole).
    firstTokenTimeoutMs: 6_000,
  });

  const answer = reply.answer.trim();
  const holds = citationsHold(facts, reply.fieldsUsed);
  trace?.step(
    `model: relevant ${reply.relevant ? "✓" : "✗"} · grounded ${reply.grounded ? "✓" : "✗"} · ` +
      `cites [${reply.fieldsUsed.join(", ")}]` +
      (reply.relevant && reply.grounded ? ` · citations hold ${holds ? "✓" : "✗ (rejected)"}` : "")
  );
  if ((!reply.relevant || !reply.grounded) && answer && !declineText(answer)) {
    trace?.step("model's wording rejected (link / contact / too long) → fixed copy");
  }
  // Not a question about this car: whatever else the model claims, no fact is
  // shown — "test" once came back answered with an unrelated one.
  if (!reply.relevant) {
    const message = declineText(answer);
    return message ? { grounded: false, offTopic: true, message } : { grounded: false, offTopic: true };
  }
  if (!reply.grounded) {
    const message = declineText(answer);
    return message ? { grounded: false, message } : { grounded: false };
  }
  if (!answer || !holds) {
    return { grounded: false };
  }
  return { grounded: true, answer, fieldsUsed: [...new Set(reply.fieldsUsed)] };
}
