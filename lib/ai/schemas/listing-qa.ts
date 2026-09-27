import { z } from "zod";
import { LISTING_FACT_KEYS } from "@/lib/ai/grounding";

/**
 * A buyer's question answered from one listing, or declined.
 *
 * `relevant` then `fieldsUsed` come first on purpose: the model writes fields
 * in schema order, so it decides whether this is a question about the car at
 * all, then names the facts it is relying on, before it writes the answer
 * rather than justifying an answer after the fact. It is an enum over the
 * listing's fact keys, so a citation can only point at something real — and
 * the service then checks that this particular listing actually has it.
 */
export const listingQaSchema = z.object({
  // First, so the model decides whether this is a question at all before it
  // reaches for a fact — "test" once came back with an unrelated answer.
  relevant: z.boolean(),
  fieldsUsed: z.array(z.enum(LISTING_FACT_KEYS)).max(LISTING_FACT_KEYS.length),
  grounded: z.boolean(),
  answer: z.string().max(600),
});

export type ListingQaReply = z.infer<typeof listingQaSchema>;
