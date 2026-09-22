import type { useComparePage } from "@/hooks/use-compare-page";
import type { SerializedCarWithImages } from "@/lib/utils/serializers";

/**
 * One car in the comparison — anchored on the serializer rather than on
 * `useComparePage`. The hook calls `computeDifferences`/`computeWinners` from
 * `_components/utils`, so deriving the car from the hook would make the two
 * modules circularly reference each other's inferred types. This is the exact
 * type the hook's `select` produces.
 */
export type CompareCar = SerializedCarWithImages;

/** Everything `useComparePage` returns; the page spreads it into the presenter. */
export type ComparePageData = ReturnType<typeof useComparePage>;

/** The handler bag threaded down from the hook to every compare component. */
export type CompareHandlers = ComparePageData["handlers"];

/** Spec key → whether the cars disagree on it. Also carries "features". */
export type CompareDifferences = Record<string, boolean>;

/** Spec key → the winning car's id, or null on a tie. Also carries "features". */
export type CompareWinners = Record<string, string | null>;

/** The car fields the comparison table renders as rows. */
export type SpecKey =
  | "make"
  | "model"
  | "year"
  | "price"
  | "bodyType"
  | "mileage"
  | "fuelType"
  | "transmission"
  | "color"
  | "seats";

/** Whatever `car[key]` holds for a spec row. */
export type SpecValue = CompareCar[SpecKey];
