/**
 * What a dealer states about a car's history and a dealership's terms — the
 * facts buyers ask about before anything else.
 *
 * **Null means "not stated", never "no".** A listing silent about accidents is
 * not a listing claiming there were none. Every reader of these fields — the
 * listing page, the buyer assistant — shows or cites only what was stated.
 *
 * Pure and dependency-free: the dealer form, the server schema, the listing
 * page and the assistant's grounding all read it.
 */

export const SERVICE_HISTORY = ["FULL", "PARTIAL", "NONE"] as const;
export type ServiceHistoryValue = (typeof SERVICE_HISTORY)[number];

/** A car's disclosures as stored and served. */
export interface CarDisclosures {
  /** "فابريكا": no panel repainted. */
  originalPaint: boolean | null;
  accidentFree: boolean | null;
  /** Owners the car has had; 1 = first owner. */
  ownerCount: number | null;
  serviceHistory: ServiceHistoryValue | null;
  priceNegotiable: boolean | null;
  /** The month the licence runs to, "YYYY-MM". */
  licenseValidUntil: string | null;
}

export const CAR_DISCLOSURE_KEYS = [
  "originalPaint",
  "accidentFree",
  "ownerCount",
  "serviceHistory",
  "priceNegotiable",
  "licenseValidUntil",
] as const satisfies readonly (keyof CarDisclosures)[];

/** A dealership's standing terms, true of every car it sells. */
export interface DealershipTerms {
  offersFinancing: boolean | null;
  /** Banks, years, down payment — in the dealer's own words. */
  financingNote: string | null;
  acceptsTradeIn: boolean | null;
  allowsInspection: boolean | null;
  offersDelivery: boolean | null;
}

export const DEALERSHIP_TERM_FLAGS = [
  "offersFinancing",
  "acceptsTradeIn",
  "allowsInspection",
  "offersDelivery",
] as const satisfies readonly (keyof DealershipTerms)[];

// ── The form's representation ──────────────────────────────────────────────
// Selects hold strings, and Radix's Select cannot use "" as an item value, so
// "not stated" is its own sentinel rather than an empty string.

export const UNSET = "unset";
export type TriStateFormValue = typeof UNSET | "yes" | "no";

export interface CarDisclosureFormValues {
  originalPaint: TriStateFormValue;
  accidentFree: TriStateFormValue;
  ownerCount: string; // UNSET or "1".."6"
  serviceHistory: typeof UNSET | ServiceHistoryValue;
  priceNegotiable: TriStateFormValue;
  licenseValidUntil: string; // "" or "YYYY-MM", as <input type="month"> holds it
}

export function triStateToForm(value: boolean | null | undefined): TriStateFormValue {
  return value === true ? "yes" : value === false ? "no" : UNSET;
}

export function triStateFromForm(value: string | undefined): boolean | null {
  return value === "yes" ? true : value === "no" ? false : null;
}

/**
 * "YYYY-MM" from a stored date (a Date from Prisma, an ISO string once
 * serialized) or a month string. Read in UTC: the column is a bare date, and a
 * local-time read east of UTC would never shift it, but west of it would.
 */
export function licenseMonth(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM" to the first day of that month, as the DATE column stores it. */
export function licenseMonthToDate(month: string | null | undefined): Date | null {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

/** A stored or serialized car's disclosures, for pre-filling the dealer form. */
export function disclosuresToForm(car: {
  originalPaint?: boolean | null;
  accidentFree?: boolean | null;
  ownerCount?: number | null;
  serviceHistory?: string | null;
  priceNegotiable?: boolean | null;
  licenseValidUntil?: Date | string | null;
}): CarDisclosureFormValues {
  return {
    originalPaint: triStateToForm(car.originalPaint),
    accidentFree: triStateToForm(car.accidentFree),
    ownerCount: car.ownerCount ? String(car.ownerCount) : UNSET,
    serviceHistory: SERVICE_HISTORY.includes(car.serviceHistory as ServiceHistoryValue)
      ? (car.serviceHistory as ServiceHistoryValue)
      : UNSET,
    priceNegotiable: triStateToForm(car.priceNegotiable),
    licenseValidUntil: licenseMonth(car.licenseValidUntil) ?? "",
  };
}

/** The form's strings to what the server stores. Every field is sent, so clearing one clears it. */
export function disclosuresFromForm(values: Partial<CarDisclosureFormValues>): CarDisclosures {
  const owners = Number.parseInt(values.ownerCount ?? "", 10);
  return {
    originalPaint: triStateFromForm(values.originalPaint),
    accidentFree: triStateFromForm(values.accidentFree),
    ownerCount: Number.isInteger(owners) && owners > 0 ? owners : null,
    serviceHistory: SERVICE_HISTORY.includes(values.serviceHistory as ServiceHistoryValue)
      ? (values.serviceHistory as ServiceHistoryValue)
      : null,
    priceNegotiable: triStateFromForm(values.priceNegotiable),
    licenseValidUntil: licenseMonth(values.licenseValidUntil) ?? null,
  };
}

/** Only what was stated: the listing page shows these, the assistant cites these. */
export function statedDisclosures(car: Partial<CarDisclosures>): Partial<CarDisclosures> {
  const stated: Partial<CarDisclosures> = {};
  for (const key of CAR_DISCLOSURE_KEYS) {
    const value = car[key];
    if (value !== null && value !== undefined) (stated as Record<string, unknown>)[key] = value;
  }
  return stated;
}

export function statedTerms(terms: Partial<DealershipTerms>): Partial<DealershipTerms> {
  const stated: Partial<DealershipTerms> = {};
  for (const key of DEALERSHIP_TERM_FLAGS) {
    if (typeof terms[key] === "boolean") stated[key] = terms[key];
  }
  const note = terms.financingNote?.trim();
  // A financing note only means something next to "offers financing: yes".
  if (note && terms.offersFinancing) stated.financingNote = note;
  return stated;
}
