import { expandSearchTerm, findCity, findGovernorate } from "@/lib/locations";

/** A place as the dealership columns store it: a city slug or a governorate code. */
export interface PlaceFilter {
  city?: string;
  region?: string;
}

export function resolvePlace(name?: string): PlaceFilter {
  const trimmed = name?.trim();
  if (!trimmed) return {};
  const exact = expandSearchTerm(trimmed).exact;
  const region = exact.find((value) => findGovernorate(value));
  if (region) return { region };
  const city = exact.find((value) => findCity(value));
  return { city: city ?? trimmed };
}
