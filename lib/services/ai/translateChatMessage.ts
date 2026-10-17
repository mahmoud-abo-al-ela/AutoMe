import type { Locale } from "@/i18n/routing";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { chatTranslationPrompt, type ChatSender } from "@/lib/ai/prompts/chat-translation";
import { chatTranslationSchema } from "@/lib/ai/schemas/chat-translation";
import { textPart } from "@/lib/ai/provider/types";

export type { ChatSender };

export async function translateChatMessage(
  text: string,
  to: Locale,
  sender: ChatSender | null,
  ctx: AiCallerContext
): Promise<string> {
  const reply = await generateStructured({
    feature: AI_FEATURES.chatTranslation,
    task: "textFast",
    system: chatTranslationPrompt.text(to, sender),
    parts: [textPart(JSON.stringify(text))],
    schema: chatTranslationSchema,
    promptVersion: `${chatTranslationPrompt.version}.${to}.${sender ?? "unknown"}`,
    ctx,
    cacheBytes: text,
    // A private message between buyer and dealer: never into the shared cache.
    privateCache: true,
    thinking: "low",
    temperature: 0,
    // Same reasoning as the listing assistant: the fast chain's Google
    // models answer in ~1 s when serving, so one silent for 6 s is queued.
    firstTokenTimeoutMs: 6_000,
  });
  return reply.translation.trim();
}
