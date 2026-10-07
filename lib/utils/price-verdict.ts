/**
 * How a listing price reads against comparable listings — the fair-price
 * gauge's rule, kept here (not in the gauge, a client component) so server
 * code such as the dealer overview's "priced above similar cars" applies the
 * exact same band and the two can never disagree about one car.
 */

/** Within ±FAIR_BAND % of the comparable median reads as a fair price. */
export const FAIR_BAND = 5;

export type PriceVerdict = "below" | "fair" | "above" | "unknown";

/** `percent` is the car against the comparable median (−6 = 6% below); null when unknown. */
export function priceVerdict(percent: number | null): PriceVerdict {
  if (percent == null) return "unknown";
  if (percent <= -FAIR_BAND) return "below";
  if (percent >= FAIR_BAND) return "above";
  return "fair";
}
