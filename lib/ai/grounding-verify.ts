import type { ListingFactKey, ListingFacts } from "@/lib/ai/grounding";
import { toLatinDigits } from "@/lib/utils/phone";

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
