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
  "features",
  "title",
  "description",
  "dealership",
  "workingHours",
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
  dealership: {
    name: string;
    /** City and governorate, already in the reader's language — never the stored codes. */
    place: string | null;
    address: string | null;
    phone: string | null;
  };
  workingHours: {
    dayOfWeek: string[];
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }[];
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
    // A zero odometer on a used listing is the dealer not filling it in, and
    // "0 km" stated as fact is exactly the invented answer this must not give.
    mileage: source.mileage > 0 ? { value: source.mileage, unit: "km" } : undefined,
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
    dealership: {
      name: source.dealership.name,
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
