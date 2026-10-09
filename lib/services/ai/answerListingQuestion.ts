import { generateStructuredWithMeta, type AiCallerContext, type AiCallMeta } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { citationsHold, type ListingFacts, type ListingFactKey } from "@/lib/ai/grounding";
import { unbackedNumbers } from "@/lib/ai/grounding-verify";
import { listingQaPrompt } from "@/lib/ai/prompts/listing-qa";
import { listingQaSchema, type ListingQaReply } from "@/lib/ai/schemas/listing-qa";
import { textPart } from "@/lib/ai/provider/types";
import { questionKey } from "@/lib/utils/question-key";
import type { Trace } from "@/lib/utils/dev-trace";

/**
 * What a buyer is shown: an answer the record backs, or a decline — with the
 * model's own wording for it when that wording passes declineText, and the
 * caller's fixed wording when it does not. `meta` says which call wrote it.
 */
export type ListingAnswer = { meta: AiCallMeta } & (
  | {
      grounded: true;
      answer: string;
      fieldsUsed: ListingFactKey[];
      /** Buttons for the answer; each one backed by the record — see backedActions. */
      actions?: ListingAction[];
      /** The `ref` of each other car the answer names, each one in the record. */
      carRefs?: number[];
      /** The question restated to stand alone, when the model gave one. */
      standalone?: string;
    }
  /** `offTopic`: not a question about this car at all — nothing for the dealer. */
  | { grounded: false; message?: string; offTopic?: true; standalone?: string }
);

/** An earlier exchange, as the page sends it back. Context, never facts. */
export interface PastExchange {
  question: string;
  answer: string;
}

export type ListingAction = ListingQaReply["actions"][number];

const MAX_DECLINE_CHARS = 240;
/** Cards under one answer; more is a list, and the answer already named them. */
const MAX_CAR_CARDS = 3;

/**
 * The buttons the model asked for that this listing can back: directions
 * need the dealership's address, a call its phone, a test drive a car still
 * for sale. The model only chooses whether a button fits the answer; what it
 * opens comes from the dealer's row.
 */
function backedActions(facts: ListingFacts, requested: readonly ListingAction[]): ListingAction[] {
  const dealership = (facts.dealership ?? {}) as { address?: string; phone?: string };
  const backed: Record<ListingAction, boolean> = {
    directions: Boolean(dealership.address),
    call: Boolean(dealership.phone),
    testDrive: facts.status === "AVAILABLE",
  };
  return [...new Set(requested)].filter((action) => backed[action]);
}

/**
 * The other cars the answer names, as refs this record has — and only when
 * the answer cites otherCars, so a card never appears beside an answer that
 * is not about alternatives.
 */
function backedCarRefs(facts: ListingFacts, cited: readonly ListingFactKey[], named: readonly number[]): number[] {
  if (!cited.includes("otherCars") || !Array.isArray(facts.otherCars)) return [];
  const known = new Set((facts.otherCars as { ref: number }[]).map((car) => car.ref));
  return [...new Set(named)].filter((ref) => known.has(ref)).slice(0, MAX_CAR_CARDS);
}

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
 * is shown only when it also cites at least one fact, every cited fact is one
 * this listing actually has, and every number it states is the record's (see
 * unbackedNumbers). Anything else is a decline.
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
  options: { trace?: Trace; history?: PastExchange[] } = {}
): Promise<ListingAnswer> {
  const { trace, history = [] } = options;
  const record = JSON.stringify(facts);
  const { data: reply, meta } = await generateStructuredWithMeta({
    feature: AI_FEATURES.listingQA,
    // A buyer is waiting on the page: the fast chain, not the dealer one.
    task: "textFast",
    system: listingQaPrompt.text(language),
    parts: [
      textPart(record),
      ...(history.length > 0 ? [textPart(JSON.stringify(history))] : []),
      textPart(JSON.stringify(question)),
    ],
    schema: listingQaSchema,
    promptVersion: `${listingQaPrompt.version}.${language}`,
    ctx,
    // The record is in the key, so an edited listing is never answered from
    // its old self, and two listings never share an answer. A re-asked
    // question costs the dealer nothing; the model still sees what was typed.
    // The conversation is in the key too: "and the price?" means something
    // different after each question it can follow.
    cacheBytes: `${record}\0${JSON.stringify(history)}\0${questionKey(question)}`,
    thinking: "low",
    temperature: 0,
    // The fast chain's Google models answer in ~1 s when they are serving;
    // one silent for 6 s is queued. 15 s here left CodeCraft, behind it, too
    // little of the budget to answer (seen live: a question timed out whole).
    firstTokenTimeoutMs: 6_000,
  });

  const answer = reply.answer.trim();
  const standalone = (reply.standalone ?? "").trim() || undefined;
  const holds = citationsHold(facts, reply.fieldsUsed);
  if (history.length > 0) trace?.step(`follow-up read as: "${standalone ?? question}"`);
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
    return { meta, grounded: false, offTopic: true, ...(message && { message }) };
  }
  if (!reply.grounded) {
    const message = declineText(answer);
    return { meta, grounded: false, ...(message && { message }), ...(standalone && { standalone }) };
  }
  // Citing a real fact is not stating it correctly: every number must be one
  // the record holds, or the answer is withheld like one with bad citations.
  const unbacked = unbackedNumbers(answer, facts, reply.fieldsUsed, question);
  if (unbacked.length > 0) trace?.step(`numbers not in the record: [${unbacked.join(", ")}] → rejected`);
  if (!answer || !holds || unbacked.length > 0) {
    return { meta, grounded: false, ...(standalone && { standalone }) };
  }
  const fieldsUsed = [...new Set(reply.fieldsUsed)];
  const actions = backedActions(facts, reply.actions ?? []);
  const carRefs = backedCarRefs(facts, fieldsUsed, reply.carsNamed ?? []);
  if (actions.length > 0 || carRefs.length > 0) {
    trace?.step(`buttons: [${actions.join(", ")}] · cars named: [${carRefs.join(", ")}]`);
  }
  return {
    meta,
    grounded: true,
    answer,
    fieldsUsed,
    ...(actions.length > 0 && { actions }),
    ...(carRefs.length > 0 && { carRefs }),
    ...(standalone && { standalone }),
  };
}
