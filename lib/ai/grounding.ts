/**
 * Grounded context for features that answer rather than extract.
 *
 * The buyer Q&A may only say what one car's record says. This module decides
 * what "the record" is: a fixed set of named facts, built from the row, with
 * empty values left out. The names double as the enum the model cites in
 * `fieldsUsed`, so an answer can be checked against the facts it claims —
 * citing a fact this listing does not have is treated as no answer at all.
 *
 * The context is bounded: free text is truncated and lists are capped, so a
 * dealer pasting a novel into the description cannot inflate every call.
 */

import type { CarDisclosures, DealershipTerms } from "@/lib/utils/car-disclosures";

/** Every fact a listing answer may rest on. Order is the order the model sees. */
export const LISTING_FACT_KEYS = [
  "make",
  "model",
  "year",
  "bodyType",
  "color",
  "seats",
  "fuelType",
  "transmission",
  "mileage",
  "price",
  "status",
  "listedOn",
  "features",
  "photos",
  "title",
  "description",
  "dealership",
  "workingHours",
  "history",
  "dealershipTerms",
  "otherCars",
  "marketPrices",
  "dealerAnswers",
] as const;

export type ListingFactKey = (typeof LISTING_FACT_KEYS)[number];

/** The row a listing context is built from, as the service loads it. */
export interface ListingSource {
  make: string;
  model: string;
  year: number;
  bodyType: string;
  color: string;
  seats: number | null;
  fuelType: string;
  transmission: string;
  mileage: number;
  /** Whole EGP, never converted — see the money skill. */
  price: number;
  priceCurrency: string;
  status: string;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  features: string[];
  featuresAr: string[];
  /** The date it was first listed, "YYYY-MM-DD". */
  listedOn: string | null;
  /**
   * What its photos show, one line per photo in display order, in the
   * reader's language. Written by a model from the photos, so evidence of
   * what is visible, not a verified fact about condition.
   */
  photos: string[];
  dealership: {
    name: string;
    /** City and governorate, already in the reader's language — never the stored codes. */
    place: string | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    /** The dealer's own "about" text. */
    about: string | null;
    /** AutoMe's aggregate of approved buyer reviews; null with none. */
    rating: { average: number; reviews: number } | null;
  };
  workingHours: {
    dayOfWeek: string[];
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }[];
  /** What the dealer stated about the car's history; stated keys only. */
  history: Partial<CarDisclosures>;
  /** The dealership's standing terms; stated keys only. */
  terms: Partial<DealershipTerms>;
  /**
   * The dealership's other cars on sale — closestByPrice picks which. An
   * empty list is a fact ("none for sale"); null means it could not be read.
   */
  otherCars: OtherCar[] | null;
  /** How this price sits among comparable listings — summarizeMarketPrices. */
  marketPrices: MarketPrices | null;
  /**
   * The dealer's own answers to earlier buyers' questions — on this car, or
   * marked by the dealer as true of every car they sell.
   */
  dealerAnswers: {
    question: string;
    answer: string | null;
    appliesToAllCars: boolean;
  }[];
}

export type ListingFacts = Partial<Record<ListingFactKey, unknown>>;

/** Another car the same dealership has on sale, as its listing shows it. */
export interface OtherCar {
  year: number;
  make: string;
  model: string;
  color: string;
  /** Whole EGP. */
  price: number;
  mileage: number;
  bodyType: string;
  transmission: string;
  fuelType: string;
}

/**
 * Asking prices of comparable listings on AutoMe, reduced to what a buyer
 * can use. The comparison is computed here, not left to the model: "8%
 * below the median" is arithmetic, and a model doing it is a model that can
 * get it wrong in public.
 */
export interface MarketPrices {
  listings: number;
  min: number;
  median: number;
  max: number;
  currency: string;
  /** This car against the median, as a whole percentage: -8 is 8% below. */
  thisCarVsMedianPercent: number;
  /** What was compared — the answer must say it. */
  compared: Comparison;
}

/** One way of finding comparable listings; see COMPARISONS. */
export interface Comparison {
  make: string;
  /** Present when the same model was compared. */
  model?: string;
  /** Present when the same make and body type was compared instead. */
  bodyType?: string;
  years: [number, number];
}

/**
 * Tried in order until one finds enough listings: the same model close in
 * age, then the same model across more years, then the same make and body
 * type. Never wider — "SUVs from 2021 to 2025" spans prices too far apart to
 * say anything about one car.
 */
export const COMPARISONS = [
  { by: "model", yearSpan: 1 },
  { by: "model", yearSpan: 3 },
  { by: "bodyType", yearSpan: 2 },
] as const;

export function comparisonFor(
  car: { make: string; model: string; bodyType: string; year: number },
  level: (typeof COMPARISONS)[number]
): Comparison {
  return {
    make: car.make,
    ...(level.by === "model" ? { model: car.model } : { bodyType: car.bodyType }),
    years: [car.year - level.yearSpan, car.year + level.yearSpan],
  };
}

/** Fewer comparable listings than this is an anecdote, not a range. */
export const MIN_COMPARABLE_LISTINGS = 3;
const MAX_OTHER_CARS = 8;
const MAX_PHOTOS = 10;

export function summarizeMarketPrices(
  prices: number[],
  car: { price: number; currency: string },
  compared: Comparison
): MarketPrices | null {
  const sorted = prices.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (sorted.length < MIN_COMPARABLE_LISTINGS || car.price <= 0) return null;

  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
  return {
    listings: sorted.length,
    min: sorted[0],
    median,
    max: sorted[sorted.length - 1],
    currency: car.currency,
    thisCarVsMedianPercent: Math.round(((car.price - median) / median) * 100),
    compared,
  };
}

/**
 * The alternatives worth offering: the dealership's other cars closest in
 * price to this one, since "anything cheaper?" and "got it in black?" are
 * both asked by a buyer with this budget.
 */
export function closestByPrice<T extends OtherCar>(cars: T[], price: number, limit = MAX_OTHER_CARS): T[] {
  return [...cars]
    .sort((a, b) => Math.abs(a.price - price) - Math.abs(b.price - price))
    .slice(0, limit);
}

const MAX_TEXT_CHARS = 1500;
const MAX_FEATURES = 50;

function clip(text: string | null | undefined): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_TEXT_CHARS ? `${trimmed.slice(0, MAX_TEXT_CHARS)}…` : trimmed;
}

/** Both languages when both exist; the model answers in the reader's. */
function bilingual(en: string | null, ar: string | null, legacy: string | null) {
  const english = clip(en) ?? clip(legacy);
  const arabic = clip(ar);
  if (!english && !arabic) return undefined;
  return { ...(english && { en: english }), ...(arabic && { ar: arabic }) };
}

function nonEmpty(list: string[]): string[] | undefined {
  const kept = list.map((item) => item.trim()).filter(Boolean).slice(0, MAX_FEATURES);
  return kept.length > 0 ? kept : undefined;
}

function dealerAnswers(answers: ListingSource["dealerAnswers"]) {
  const kept = answers.flatMap((entry) => {
    const answer = clip(entry.answer);
    const question = clip(entry.question);
    if (!answer || !question) return [];
    return [{ question, answer, about: entry.appliesToAllCars ? "allCars" : "thisCar" }];
  });
  return kept.length > 0 ? kept : undefined;
}

/**
 * The facts a question about this listing may be answered from. A key is
 * present only when the row has a value for it — absence is what lets the
 * caller reject an answer that cites a fact the listing never stated.
 */
export function buildListingFacts(source: ListingSource): ListingFacts {
  const facts: ListingFacts = {
    make: source.make,
    model: source.model,
    year: source.year,
    bodyType: source.bodyType,
    color: source.color,
    seats: source.seats ?? undefined,
    fuelType: source.fuelType,
    transmission: source.transmission,
    // A zero odometer on an older listing is the dealer not filling it in, and
    // "0 km" stated as fact is exactly the invented answer this must not give.
    // On this year's or last year's model it is a new car, and 0 km is true —
    // the same line the listing-quality rules draw (zeroMileage).
    mileage:
      source.mileage > 0 || source.year >= new Date().getFullYear() - 1
        ? { value: source.mileage, unit: "km" }
        : undefined,
    price:
      source.price > 0 ? { amount: source.price, currency: source.priceCurrency } : undefined,
    status: source.status,
    features:
      nonEmpty(source.features) || nonEmpty(source.featuresAr)
        ? {
            ...(nonEmpty(source.features) && { en: nonEmpty(source.features) }),
            ...(nonEmpty(source.featuresAr) && { ar: nonEmpty(source.featuresAr) }),
          }
        : undefined,
    title: bilingual(source.titleEn, source.titleAr, source.title),
    description: bilingual(source.descriptionEn, source.descriptionAr, source.description),
    listedOn: source.listedOn ?? undefined,
    photos: nonEmpty(source.photos.slice(0, MAX_PHOTOS)),
    dealership: {
      name: source.dealership.name,
      ...(clip(source.dealership.about) && { about: clip(source.dealership.about) }),
      ...(source.dealership.rating && { rating: source.dealership.rating }),
      ...(source.dealership.website && { website: source.dealership.website }),
      ...(source.dealership.place && { place: source.dealership.place }),
      ...(source.dealership.address && { address: source.dealership.address }),
      ...(source.dealership.phone && { phone: source.dealership.phone }),
    },
    workingHours:
      source.workingHours.length > 0
        ? source.workingHours.map((hours) => ({
            days: hours.dayOfWeek,
            ...(hours.isOpen
              ? { open: true, opens: hours.openTime, closes: hours.closeTime }
              : { open: false }),
          }))
        : undefined,
    // Stated keys only, so a missing key reads as "not stated", never "no".
    history: Object.keys(source.history).length > 0 ? source.history : undefined,
    dealershipTerms: Object.keys(source.terms).length > 0 ? source.terms : undefined,
    // Empty is kept: "this dealership has no other cars for sale" is an
    // answer. Only an unknown (null) is left out. Field by field, not spread:
    // the caller's rows carry ids and photo URLs the model has no use for.
    // `ref` is how an answer names a car for the cards under it.
    otherCars:
      source.otherCars !== null
        ? source.otherCars.map((car, index) => ({
            ref: index + 1,
            year: car.year,
            make: car.make,
            model: car.model,
            color: car.color,
            price: { amount: car.price, currency: source.priceCurrency },
            mileage: { value: car.mileage, unit: "km" },
            bodyType: car.bodyType,
            transmission: car.transmission,
            fuelType: car.fuelType,
          }))
        : undefined,
    marketPrices: source.marketPrices ?? undefined,
    dealerAnswers: dealerAnswers(source.dealerAnswers),
  };

  for (const key of LISTING_FACT_KEYS) {
    if (facts[key] === undefined || facts[key] === "") delete facts[key];
  }
  return facts;
}

/**
 * Whether an answer's citations hold up: at least one fact, and every one of
 * them present in this listing. An answer citing nothing, or citing a fact
 * the listing lacks, is an answer the record cannot back.
 */
export function citationsHold(facts: ListingFacts, cited: readonly ListingFactKey[]): boolean {
  return cited.length > 0 && cited.every((key) => key in facts);
}
