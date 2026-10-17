import { z } from "zod";

export const listingTranslationSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(2000),
  features: z.array(z.string().max(80)).max(30),
});

export type ListingTranslation = z.infer<typeof listingTranslationSchema>;
