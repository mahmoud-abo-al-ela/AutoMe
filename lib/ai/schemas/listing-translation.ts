import { z } from "zod";

/**
 * A listing's text in the target language. Sent to Gemini as the response
 * schema and used to validate the reply, like carListingSchema.
 *
 * Same limits as the Car columns the result is written into, so a reply that
 * validates here cannot then fail the car schema on save.
 */
export const listingTranslationSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(2000),
  features: z.array(z.string().max(80)).max(30),
});

export type ListingTranslation = z.infer<typeof listingTranslationSchema>;
