import { z } from "zod";

export const chatTranslationSchema = z.object({
  translation: z.string().min(1).max(4000),
});

export type ChatTranslationReply = z.infer<typeof chatTranslationSchema>;
