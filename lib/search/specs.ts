import arCarAttributes from "@/messages/ar/carAttributes.json";
import { BODY_TYPES, CAR_COLORS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";

/**
 * The specifications a buyer can be offered as they type — body type, fuel,
 * gearbox, colour and the editor's features — each with the value a car
 * stores and its name in both languages. Pure data: the suggestions match
 * against it, the repository counts it.
 *
 * Body, fuel, gearbox and colour are filters: choosing one sets the filter.
 * A feature is a tag in either language, so choosing one searches for it
 * (and the search's synonyms reach both tag lists).
 */

export type SpecKind = "bodyType" | "fuelType" | "transmission" | "color" | "feature";

export interface Spec {
  kind: SpecKind;
  /** As a car stores it — the filter's value, or the feature's English name. */
  value: string;
  en: string;
  ar: string;
}

const AR = arCarAttributes as unknown as Record<"body" | "fuel" | "transmission" | "color" | "feature", Record<string, string>>;

const named = (kind: SpecKind, values: readonly string[], arabic: (value: string) => string | undefined): Spec[] =>
  values.map((value) => ({ kind, value, en: value, ar: arabic(value) ?? value }));

export const SPECS: readonly Spec[] = [
  ...named("bodyType", BODY_TYPES, (value) => AR.body[value]),
  ...named("fuelType", FUEL_TYPES, (value) => AR.fuel[value]),
  ...named("transmission", TRANSMISSIONS, (value) => AR.transmission[value]),
  ...named("color", CAR_COLORS, (value) => AR.color[value.toLowerCase()]),
  ...named("feature", Object.keys(AR.feature), (value) => AR.feature[value]),
];

/** The specs the filter panel filters by — every kind but features, which are searched. */
export const FILTER_SPEC_KINDS = ["bodyType", "fuelType", "transmission", "color"] as const;
export type FilterSpecKind = (typeof FILTER_SPEC_KINDS)[number];
