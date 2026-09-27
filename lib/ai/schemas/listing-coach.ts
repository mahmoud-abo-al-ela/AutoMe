import { z } from "zod";
import { LISTING_ISSUE_CODES } from "@/lib/services/car/listing-quality";

/**
 * Advice for the issues the deterministic rules flagged — one entry per issue
 * code. The code is an enum, so the model can only advise on what the rules
 * found; it cannot invent new problems.
 */
export const listingCoachSchema = z.object({
  advice: z
    .array(
      z.object({
        code: z.enum(LISTING_ISSUE_CODES),
        text: z.string().min(1).max(300),
      })
    )
    .max(LISTING_ISSUE_CODES.length),
});

export type ListingCoachReply = z.infer<typeof listingCoachSchema>;
