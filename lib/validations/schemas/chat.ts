import { z } from "zod";

/** The cars of one chat conversation list, for their titles. */
export const carTitlesRequestSchema = z.array(z.string().uuid()).min(1).max(50);

/** A chat member asks for one message in their language. */
export const chatTranslationRequestSchema = z.object({
  // A Stream message id: client-generated UUIDs, or Stream's own ids.
  messageId: z.string().trim().min(1).max(255),
  target: z.enum(["en", "ar"]),
});
