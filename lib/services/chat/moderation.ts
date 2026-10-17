import type { MessageResponse } from "stream-chat";
import type { ChatSender } from "@/lib/ai/prompts/chat-translation";
import { getStreamServerClient } from "@/lib/stream-chat";
import { moderateChatMessage } from "@/lib/services/ai";
import { screenChatMessage } from "@/lib/utils/chat-screen";
import { currentFlag, type StoredModeration } from "@/lib/utils/chat-moderation";

export type ModerationOutcome = "skipped" | "clean" | "flagged" | "cleared" | "unchanged";

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
  // The category only: the model's reason describes a private message, and
  // logs are read far more widely than the conversation.
  console.info(`[chat-moderation] ${message.id} flagged ${verdict.category}`);
  return "flagged";
}
