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
  // The buyer's question rewritten to stand alone ("and the price?" → "how
  // much is this car?"). Filed in the dealer's inbox instead of a fragment.
  standalone: z.string().max(300),
  // No .max(): Gemma rejects an array carrying both a long enum and maxItems
  // (400 "invalid argument" at 24 keys, fine at 19), and the service dedupes
  // the citations anyway — see schemas.test.ts.
  fieldsUsed: z.array(z.enum(LISTING_FACT_KEYS)),
  grounded: z.boolean(),
  answer: z.string().max(600),
  // After the answer, because they follow from it: buttons shown under it,
  // and the `ref` of each other car it names, shown as cards. The service
  // keeps only what the record backs — a phone for "call", an address for
  // "directions", a ref that exists.
  actions: z.array(z.enum(["directions", "call", "testDrive"])),
  carsNamed: z.array(z.number().int()),
});

export type ListingQaReply = z.infer<typeof listingQaSchema>;
