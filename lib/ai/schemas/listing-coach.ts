import { z } from "zod";
import { LISTING_ISSUE_CODES } from "@/lib/services/car/listing-quality";

export const listingCoachSchema = z.object({
  advice: z
    .array(
      z.object({
        code: z.enum(LISTING_ISSUE_CODES),
        text: z.string().min(1).max(300),
      })
    ),
  // No .max() — see schemas.test.ts. The service keeps one entry per flagged
  // code whatever the model returns.
});

export type ListingCoachReply = z.infer<typeof listingCoachSchema>;
