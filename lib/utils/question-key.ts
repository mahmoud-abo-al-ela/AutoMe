import { foldSearchText } from "@/lib/utils/search-text";

/** Trailing punctuation a question may or may not carry, in either script. */
const TRAILING_PUNCTUATION = /[\s?؟!.,،]+$/u;

export function questionKey(question: string): string {
  return foldSearchText(question.normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim()
    .replace(TRAILING_PUNCTUATION, "");
}
