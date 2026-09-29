import type { Locale } from "@/i18n/routing";
import { detectTextLanguage } from "@/lib/utils/text-language";

/**
 * Chat-translation rules shared by the server (lib/services/chat/translation)
 * and the chat UI, so the "Translate" link is offered on exactly the messages
 * the server will translate.
 */

/** Longer messages are not offered a translation. */
export const MAX_TRANSLATABLE_CHARS = 2000;

/** A translation as stored on the Stream message, with the text it was made from. */
export interface StoredTranslation {
  text: string;
  /** The (trimmed) message text translated. An edited message no longer matches it. */
  source: string;
}

export type MessageTranslations = Partial<Record<Locale, StoredTranslation>>;

/** A stored translation, only while it still describes the message's text. */
export function currentTranslation(
  translations: MessageTranslations | undefined,
  text: string,
  to: Locale
): string | null {
  const stored = translations?.[to];
  return stored && stored.source === text && stored.text ? stored.text : null;
}

/**
 * Whether a message can be translated into `to`: real text, not too long, and
 * written in the other language. `text` is the trimmed message text.
 */
export function isTranslatable(text: string, to: Locale): boolean {
  if (!text || text.length > MAX_TRANSLATABLE_CHARS) return false;
  const from = detectTextLanguage(text);
  return from !== null && from !== to;
}
