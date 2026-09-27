import { foldSearchText } from "@/lib/utils/search-text";

/** Trailing punctuation a question may or may not carry, in either script. */
const TRAILING_PUNCTUATION = /[\s?؟!.,،]+$/u;

/**
 * The form of a buyer's question that recognises a repeat: case, spacing,
 * Unicode form, trailing punctuation and Arabic spelling variants (alef forms,
 * yaa, taa marbuta, tashkeel) do not change what is being asked.
 *
 * Used for the answer cache and for folding repeats in the dealer's inbox, so
 * the two agree on what "the same question" means. Deliberately literal: "is
 * the price negotiable" and "can I haggle" stay two questions. Anything looser
 * would need a model, and a wrong merge hides a question from the dealer.
 */
export function questionKey(question: string): string {
  return foldSearchText(question.normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim()
    .replace(TRAILING_PUNCTUATION, "");
}
