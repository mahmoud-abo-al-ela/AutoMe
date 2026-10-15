import { expandSearchTerm, findCity, findGovernorate } from "@/lib/locations";

/** A place as the dealership columns store it: a city slug or a governorate code. */
export interface PlaceFilter {
  city?: string;
  region?: string;
}

/**
 * The place a reader outside the site named — "New Cairo", "القاهرة", or a city
 * slug — as the columns store it. A governorate covers its cities, so "Cairo"
 * reaches a dealership in New Cairo. A name AutoMe does not know stays a city
 * filter and matches nothing, rather than being dropped and widening the search.
 */
export function resolvePlace(name?: string): PlaceFilter {
  const trimmed = name?.trim();
  if (!trimmed) return {};
  const exact = expandSearchTerm(trimmed).exact;
  const region = exact.find((value) => findGovernorate(value));
  if (region) return { region };
  const city = exact.find((value) => findCity(value));
  return { city: city ?? trimmed };
}
