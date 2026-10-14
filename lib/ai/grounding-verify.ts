import type { ListingFactKey, ListingFacts } from "@/lib/ai/grounding";
import { toLatinDigits } from "@/lib/utils/phone";

/**
 * Whether the numbers in an answer are the record's numbers.
 *
 * `citationsHold` checks that an answer cites facts the listing has — not
 * that it states them correctly. An answer citing `price` that says 650,000
 * when the record says 720,000 passes it. Numbers are where a wrong answer
 * costs a buyer most (price, year, mileage, hours), and the one kind of claim
 * that can be checked mechanically, so every number in an answer must be one
 * the record holds.
 *
 * Where a number may come from:
 * - the facts the answer cites — the claim it makes;
 * - the car's identity — year, make and model — and the dealership's name,
 *   which an answer names them by without citing them ("this 2019 i10 is
 *   silver", "Auto 2000 opens at 10");
 * - the buyer's own question: "is it under 800k?" may be answered with 800k.
 * Never the conversation so far: the page sends it, so it is not evidence.
 * Never the questions *other* buyers asked, kept beside the dealer's answers:
 * a buyer wrote them, so a number planted in one is not the record's.
 */

/**
 * Prices and mileages are rounded in speech ("1.3 million" for 1,250,000);
 * years, counts and hours are not — and a year is in the thousands, so the
 * line sits above any year.
 */
const ROUNDING_TOLERANCE = 0.05;
const ROUNDED_FROM = 10_000;

const MULTIPLIERS: [RegExp, number][] = [
  [/^\s*(?:k\b|thousand|ألف|الف|آلاف|الاف)/i, 1_000],
  [/^\s*(?:m\b|mn\b|million|مليون|ملايين)/i, 1_000_000],
];

/** "720,000", "١٢٠٬٠٠٠", "4.6", "1.25", followed by an optional multiplier word. */
// A group separator only when exactly three digits follow it: "2018,2019" is
// two years, not 2,018,201.
const NUMBER = /\d+(?:[,٬]\d{3}(?!\d))*(?:[.٫]\d+)?/g;

/** Every number a text states, as values. Times also yield their 12-hour hour. */
export function numbersIn(text: string): number[] {
  const latin = toLatinDigits(text);
  const found: number[] = [];
  for (const match of latin.matchAll(NUMBER)) {
    let value = Number(match[0].replace(/[,٬]/g, "").replace("٫", "."));
    if (!Number.isFinite(value)) continue;
    const after = latin.slice(match.index! + match[0].length);
    const multiplier = MULTIPLIERS.find(([pattern]) => pattern.test(after));
    if (multiplier) value *= multiplier[1];
    found.push(value);
    // "21:00" is "9 PM" in an answer.
    if (after.startsWith(":") && value >= 13 && value <= 23) found.push(value - 12);
  }
  return found;
}

/** Every number anywhere inside a fact's value, nested objects and lists included. */
function numbersOf(value: unknown, into: number[] = []): number[] {
  if (typeof value === "number") {
    into.push(value);
    // A negative comparison is said as a positive one: "8% below".
    if (value < 0) into.push(-value);
  } else if (typeof value === "string") {
    into.push(...numbersIn(value));
  } else if (Array.isArray(value)) {
    for (const item of value) numbersOf(item, into);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) numbersOf(item, into);
  }
  return into;
}

function matches(claimed: number, allowed: number[]): boolean {
  return allowed.some((known) =>
    claimed >= ROUNDED_FROM && known >= ROUNDED_FROM
      ? Math.abs(claimed - known) <= known * ROUNDING_TOLERANCE
      : claimed === known
  );
}

/**
 * The numbers an answer states that nothing it may draw on backs — empty when
 * every number holds. The caller treats a non-empty result like failed
 * citations: no answer at all.
 */
export function unbackedNumbers(
  answer: string,
  facts: ListingFacts,
  cited: readonly ListingFactKey[],
  question: string
): number[] {
  const allowed = [
    ...numbersOf(citedRecord(facts, cited)),
    ...numbersOf([facts.year, facts.make, facts.model, (facts.dealership as { name?: string } | undefined)?.name]),
    ...numbersIn(question),
  ];
  return numbersIn(answer).filter((claimed) => !matches(claimed, allowed));
}

/**
 * The cited facts as evidence: what the dealer and the listing say. The
 * question beside each of the dealer's past answers is dropped — another
 * buyer wrote it, so nothing in it is the record's word.
 */
function citedRecord(facts: ListingFacts, cited: readonly ListingFactKey[]): unknown[] {
  return cited.map((key) => {
    const value = facts[key];
    if (key !== "dealerAnswers" || !Array.isArray(value)) return value;
    return value.map((entry) => (entry && typeof entry === "object" ? { ...entry, question: undefined } : entry));
  });
}

/** Links, domains, emails and phone numbers: what a planted instruction would put in front of a buyer. */
const CONTACT_PATTERNS = [
  /https?:\/\/[^\s)]+/gi,
  /\bwww\.[^\s)]+/gi,
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  // Any word.word with a letters-only ending, as declines are checked: an
  // answer about a car rarely needs a domain, and a false positive only
  // withholds the answer.
  /\b[a-z0-9-]{2,}\.[a-z]{2,}\b/gi,
  /[+0-9٠-٩][0-9٠-٩\s-]{6,}[0-9٠-٩]/g,
];

/** A contact as compared: lower case; a phone number as its digits alone. */
function normalizeContact(text: string): string {
  const latin = toLatinDigits(text).toLowerCase();
  return /^[+\d\s-]+$/.test(latin) ? latin.replace(/\D/g, "") : latin;
}

/**
 * The links, emails and phone numbers an answer states that the dealer's own
 * record does not — empty when there are none. A grounded answer may repeat
 * the dealership's phone or website (a buyer asked for it); it may not carry
 * one that only a buyer-written question, a planted instruction or the model
 * itself supplied. The caller treats any as failed grounding: no answer.
 */
export function unbackedContacts(answer: string, facts: ListingFacts, cited: readonly ListingFactKey[]): string[] {
  const record = JSON.stringify([citedRecord(facts, cited), facts.dealership]) ?? "";
  const known = normalizeContact(record);
  const knownDigits = toLatinDigits(record).replace(/\D/g, "");
  const found = CONTACT_PATTERNS.flatMap((pattern) => answer.match(pattern) ?? []);
  return found.filter((contact) => {
    const normal = normalizeContact(contact);
    return /^\d+$/.test(normal) ? !knownDigits.includes(normal) : !known.includes(normal);
  });
}
