import { foldSearchText } from "@/lib/utils/search-text";

/**
 * What a buyer typed into the listing assistant, before any model sees it.
 *
 * Every question sent to the model is billed to the dealer's allowance and
 * takes seconds; a greeting, a thank-you or a keyboard mash deserves neither.
 * These are answered instantly with fixed copy, and never reach the dealer's
 * buyer-questions inbox. Deliberately conservative: anything that might be a
 * real question goes to the model — a false "noise" would turn a buyer away.
 */
export type BuyerMessageKind = "question" | "greeting" | "thanks" | "noise";

const GREETINGS = new Set(
  [
    "hi", "hello", "hey", "hey there", "hi there", "good morning", "good evening", "yo",
    "السلام عليكم", "سلام عليكم", "السلام", "سلام", "اهلا", "اهلين", "مرحبا", "ازيك", "ازيكم",
    "صباح الخير", "مساء الخير", "هاي", "هالو", "يا هلا",
  ].map(fold)
);

/** Someone trying the box out, not asking anything. */
const PROBES = new Set(
  ["test", "testing", "test test", "tst", "تست", "تجربة", "تجربه", "اختبار", "asdf", "qwerty"].map(fold)
);

const THANKS = new Set(
  [
    "thanks", "thank you", "thx", "ok thanks", "ok thank you", "great thanks", "ok", "okay",
    "شكرا", "شكرا جزيلا", "متشكر", "متشكرين", "تسلم", "تسلمي", "ميرسي", "تمام", "تمام شكرا", "ماشي",
  ].map(fold)
);

/** Case, spelling variants, punctuation and emoji do not change a greeting. */
function fold(text: string): string {
  return foldSearchText(text.normalize("NFKC"))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyBuyerMessage(text: string): BuyerMessageKind {
  const letters = [...text].filter((char) => /\p{L}/u.test(char));
  // "؟؟؟", "123", "👍👍" — nothing a model could read as a question.
  if (letters.length < 2) return "noise";

  // "aaaaaaa", "ههههههه": one letter carrying the whole message.
  if (letters.length >= 4) {
    const counts = new Map<string, number>();
    for (const char of letters) counts.set(char.toLowerCase(), (counts.get(char.toLowerCase()) ?? 0) + 1);
    if (Math.max(...counts.values()) / letters.length > 0.7) return "noise";
  }

  const folded = fold(text);
  if (PROBES.has(folded)) return "noise";
  if (GREETINGS.has(folded)) return "greeting";
  if (THANKS.has(folded)) return "thanks";
  return "question";
}
