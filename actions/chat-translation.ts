"use server";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceChatTranslationLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { chatTranslationRequestSchema } from "@/lib/validations/schemas";
import { translateMessageFor } from "@/lib/services/chat/translation";
import { createSuccessResponse } from "@/lib/utils/response";

/**
 * A chat member taps "Translate" on a message in the other language.
 *
 * Signed-in only — chat is — and free to both sides (owner's decision,
 * 2026-09-29), so the per-user rate limit is the guard. Whether the caller may
 * read the message, and what it says, are decided by the service from Stream.
 */
export const translateChatMessageAction = withAuth(async (ctx, input: unknown) => {
  const { messageId, target } = validateAction(chatTranslationRequestSchema, input);
  await enforceChatTranslationLimit(ctx.user.id);
  const text = await translateMessageFor(ctx.user.id, messageId, target);
  return createSuccessResponse({ text });
});
