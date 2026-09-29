import { z } from "zod";

/**
 * One chat message in the other language. Sent to the model as the response
 * schema and used to validate the reply, like listingTranslationSchema.
 *
 * Twice the longest message we translate (MAX_TRANSLATABLE_CHARS): Arabic and
 * English lengths differ, and a translation cut short is worse than none.
 */
export const chatTranslationSchema = z.object({
  translation: z.string().min(1).max(4000),
});

export type ChatTranslationReply = z.infer<typeof chatTranslationSchema>;
