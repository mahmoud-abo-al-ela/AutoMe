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
