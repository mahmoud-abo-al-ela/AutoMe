import type { MessageResponse } from "stream-chat";
import type { ChatSender } from "@/lib/ai/prompts/chat-translation";
import { getStreamServerClient } from "@/lib/stream-chat";
import { moderateChatMessage } from "@/lib/services/ai";
import { screenChatMessage } from "@/lib/utils/chat-screen";
import { currentFlag, type StoredModeration } from "@/lib/utils/chat-moderation";

export type ModerationOutcome = "skipped" | "clean" | "flagged" | "cleared" | "unchanged";

/**
 * Moderate one chat message, after it has been delivered — Stream's webhook
 * calls this for every new or edited message, so a check can never delay or
 * block a message, and a failure here only means no warning.
 *
 * 1. A flag already on the message for its current text stands. (Only the
 *    author can edit a message's fields, and flagging their own message only
 *    hurts them.)
 * 2. The free screen: a message with no signal is clean, and any stale flag
 *    from before an edit is removed. This is almost every message.
 * 3. The model judges the rest, told whether the buyer or the dealership
 *    wrote it. A verdict is written onto the message by the server as its
 *    author, which Stream delivers to both people live.
 *
 * A sender who strips the flag from their own message triggers
 * `message.updated`, which runs this again and puts it back — the model's
 * answer is cached, so that costs nothing.
 */
export async function moderateMessage(message: MessageResponse | undefined): Promise<ModerationOutcome> {
  const text = message?.text?.trim() ?? "";
  const authorId = message?.user?.id;
  if (!message || message.type !== "regular" || !text || !authorId || !message.cid) return "skipped";

  const stored = message.safety_flag as StoredModeration | undefined;
  if (currentFlag(stored, text)) return "unchanged";

  const client = getStreamServerClient();
  const clear = async (): Promise<ModerationOutcome> => {
    if (!stored) return "clean";
    await client.partialUpdateMessage(message.id, { unset: ["safety_flag"] }, authorId);
    return "cleared";
  };

  if (screenChatMessage(text).length === 0) return clear();

  // The channel says who is who: its creator is the buyer (see
  // createCarInquiryChannel), and whose dealership the AI call is metered to.
  const [channel] = await client.queryChannels(
    { cid: { $eq: message.cid } },
    {},
    { user_id: authorId, limit: 1, state: false, watch: false, presence: false }
  );
  const organizationId = channel?.data?.organization_id ?? null;
  const creatorId = channel?.data?.created_by?.id;
  const sender: ChatSender | null =
    organizationId && creatorId ? (authorId === creatorId ? "buyer" : "dealership") : null;

  const verdict = await moderateChatMessage(text, sender, {
    organizationId,
    userId: null,
    // Nobody is waiting on it; paid features go first.
    priority: "low",
  });
  if (verdict.category === "none") return clear();

  const safetyFlag: StoredModeration = { category: verdict.category, source: text };
  await client.partialUpdateMessage(message.id, { set: { safety_flag: safetyFlag } }, authorId);
  console.info(`[chat-moderation] ${message.id} flagged ${verdict.category}: ${verdict.reason}`);
  return "flagged";
}
