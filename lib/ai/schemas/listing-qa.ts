import { z } from "zod";
import { LISTING_FACT_KEYS } from "@/lib/ai/grounding";

/**
 * A buyer's question answered from one listing, or declined.
 *
 * `fieldsUsed` comes first on purpose: the model writes fields in schema
 * order, so it names the facts it is relying on before it writes the answer
 * rather than justifying an answer after the fact. It is an enum over the
 * listing's fact keys, so a citation can only point at something real — and
 * the service then checks that this particular listing actually has it.
 */
export const listingQaSchema = z.object({
  fieldsUsed: z.array(z.enum(LISTING_FACT_KEYS)).max(LISTING_FACT_KEYS.length),
  grounded: z.boolean(),
  answer: z.string().max(600),
});

export type ListingQaReply = z.infer<typeof listingQaSchema>;
