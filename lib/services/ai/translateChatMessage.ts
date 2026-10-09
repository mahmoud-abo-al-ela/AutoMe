import type { Locale } from "@/i18n/routing";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { chatTranslationPrompt, type ChatSender } from "@/lib/ai/prompts/chat-translation";
import { chatTranslationSchema } from "@/lib/ai/schemas/chat-translation";
import { textPart } from "@/lib/ai/provider/types";

export type { ChatSender };

/**
 * Translate one chat message into `to`. `sender` says who wrote it — it
 * decides who is paying whom in "we can do 600k" — or null when unknown.
 *
 * On the fast chain, like the buyer assistant: someone tapped "Translate" and
 * is watching the message. Cached on the text, sender and direction, so the
 * same words are not sent twice while the cache holds them; the durable copy
 * lives on the Stream message (see lib/services/chat).
 */
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
    thinking: "low",
    temperature: 0,
    // Same reasoning as the listing assistant: the fast chain's Google
    // models answer in ~1 s when serving, so one silent for 6 s is queued.
    firstTokenTimeoutMs: 6_000,
  });
  return reply.translation.trim();
}
