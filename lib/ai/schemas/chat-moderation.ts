import { z } from "zod";

export const MODERATION_CATEGORIES = ["none", "scam", "spam", "abuse"] as const;

/**
 * The verdict on one chat message. `reason` first, so the model states what
 * it sees before it commits to a category — the same order the photo read
 * uses. It is logged, never shown.
 */
export const chatModerationSchema = z.object({
  reason: z.string().transform((text) => text.slice(0, 300)),
  category: z.enum(MODERATION_CATEGORIES),
});

export type ChatModerationVerdict = z.infer<typeof chatModerationSchema>;
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];
