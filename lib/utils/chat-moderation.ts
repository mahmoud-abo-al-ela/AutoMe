/**
 * Chat-moderation rules shared by the server (lib/services/chat/moderation)
 * and the chat UI, so both read a verdict the same way.
 */

export type FlagCategory = "scam" | "spam" | "abuse";

/** A verdict as stored on the Stream message, with the text it was made on. */
export interface StoredModeration {
  category: FlagCategory;
  /** The (trimmed) message text judged. An edited message no longer matches it. */
  source: string;
}

/** The flag on a message, only while it still describes the message's text. */
export function currentFlag(moderation: StoredModeration | undefined, text: string): FlagCategory | null {
  return moderation && moderation.source === text ? moderation.category : null;
}

/**
 * What the other person sees (owner's choice): a scam or spam message stays
 * readable under a warning; abuse is hidden until they choose to read it.
 * The sender always sees their own message as sent.
 */
export function flagDisplay(category: FlagCategory): "warn" | "hide" {
  return category === "abuse" ? "hide" : "warn";
}
