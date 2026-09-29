import type { Locale } from "@/i18n/routing";
import { getStreamServerClient } from "@/lib/stream-chat";
import { translateChatMessage, type ChatSender } from "@/lib/services/ai";
import {
  currentTranslation,
  isTranslatable,
  type MessageTranslations,
} from "@/lib/utils/chat-translation";
import { NotFoundError, ValidationError, logError } from "@/lib/utils/errors";

/**
 * Translate a chat message for a member of its conversation.
 *
 * Nothing the caller sends is trusted beyond the message id and the target
 * language: the text, the conversation and who may read it all come from
 * Stream. A caller who is not a member of the message's channel gets
 * "not found" — the same as a message that does not exist, so ids cannot be
 * probed.
 *
 * The translation is written back onto the message, as its author, by the
 * server: the other member gets it live, a second tap costs nothing, and it
 * is deleted with the message. Stream does not mark the message edited — a
 * custom field is not its text. A sender could put their own words in that
 * field from their own client; the reader then sees a "translation" of the
 * sender's message written by the sender, which says nothing the sender could
 * not have typed as the message itself.
 */
export async function translateMessageFor(
  userId: string,
  messageId: string,
  to: Locale
): Promise<string> {
  const client = getStreamServerClient();

  let message;
  try {
    ({ message } = await client.getMessage(messageId));
  } catch {
    throw new NotFoundError("Message");
  }
  if (!message?.cid) throw new NotFoundError("Message");

  const [channel] = await client.queryChannels(
    { cid: { $eq: message.cid }, members: { $in: [userId] } },
    {},
    { user_id: userId, limit: 1, state: false, watch: false, presence: false }
  );
  if (!channel) throw new NotFoundError("Message");

  // Decided here, not by the caller: a message already in the reader's
  // language is not sent to the model to be "translated" into itself.
  const text = message.text?.trim() ?? "";
  if (message.type !== "regular" || !isTranslatable(text, to)) {
    throw new ValidationError("This message cannot be translated", "messageId", {
      key: "errors.chat.cannotTranslate",
    });
  }

  const translations = message.translations as MessageTranslations | undefined;
  const stored = currentTranslation(translations, text, to);
  if (stored) return stored;

  // A dealership inquiry is opened by the buyer (createCarInquiryChannel), so
  // its creator wrote as the buyer and anyone else as the dealership. A
  // channel with no dealership says nothing about roles.
  const authorId = message.user?.id;
  const creatorId = channel.data?.created_by?.id;
  const sender: ChatSender | null =
    channel.data?.organization_id && authorId && creatorId
      ? authorId === creatorId
        ? "buyer"
        : "dealership"
      : null;

  const translated = await translateChatMessage(text, to, sender, {
    organizationId: channel.data?.organization_id ?? null,
    userId,
    // Free to everyone, so it yields to what dealers pay for.
    priority: "low",
  });

  // Keep only translations that still match the text; an edit makes the rest stale.
  const kept: MessageTranslations = {};
  for (const locale of Object.keys(translations ?? {}) as Locale[]) {
    if (currentTranslation(translations, text, locale)) kept[locale] = translations![locale];
  }
  kept[to] = { text: translated, source: text };
  // Stream requires a user for a server-side update; the author is the one
  // whose message it is. A failed write only loses the saved copy.
  await client
    .partialUpdateMessage(messageId, { set: { translations: kept } }, message.user?.id ?? userId)
    .catch((error) => logError("Could not store a chat translation", error));

  return translated;
}
