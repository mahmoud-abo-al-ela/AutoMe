import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { chatModerationPrompt } from "@/lib/ai/prompts/chat-moderation";
import type { ChatSender } from "@/lib/ai/prompts/chat-translation";
import { chatModerationSchema, type ChatModerationVerdict } from "@/lib/ai/schemas/chat-moderation";
import { textPart } from "@/lib/ai/provider/types";

export async function moderateChatMessage(
  text: string,
  sender: ChatSender | null,
  ctx: AiCallerContext
): Promise<ChatModerationVerdict> {
  return generateStructured({
    feature: AI_FEATURES.chatModeration,
    task: "textFast",
    system: chatModerationPrompt.text(sender),
    parts: [textPart(JSON.stringify(text))],
    schema: chatModerationSchema,
    promptVersion: `${chatModerationPrompt.version}.${sender ?? "unknown"}`,
    ctx,
    cacheBytes: text,
    // A private message between buyer and dealer: never into the shared cache.
    privateCache: true,
    thinking: "low",
    temperature: 0,
    firstTokenTimeoutMs: 6_000,
  });
}
