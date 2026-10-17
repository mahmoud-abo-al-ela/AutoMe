"use server";
import { withAuth } from "@/lib/middleware/with-auth";
import { enforceChatTranslationLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import { chatTranslationRequestSchema } from "@/lib/validations/schemas";
import { translateMessageFor } from "@/lib/services/chat/translation";
import { createSuccessResponse } from "@/lib/utils/response";

export const translateChatMessageAction = withAuth(async (ctx, input: unknown) => {
  const { messageId, target } = validateAction(chatTranslationRequestSchema, input);
  await enforceChatTranslationLimit(ctx.user.id);
  const text = await translateMessageFor(ctx.user.id, messageId, target);
  return createSuccessResponse({ text });
});
