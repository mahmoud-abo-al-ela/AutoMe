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
 * - the car's identity — year, make and model — which an answer names the
 *   car by without citing it ("this 2019 i10 is silver");
 * - the buyer's own question: "is it under 800k?" may be answered with 800k.
 * Never the conversation so far: the page sends it, so it is not evidence.
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
const NUMBER = /\d+(?:[,٬]\d{3})*(?:[.٫]\d+)?/g;

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
    ...numbersOf(cited.map((key) => facts[key])),
    ...numbersOf([facts.year, facts.make, facts.model]),
    ...numbersIn(question),
  ];
  return numbersIn(answer).filter((claimed) => !matches(claimed, allowed));
}
