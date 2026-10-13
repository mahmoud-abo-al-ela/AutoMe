import type { Locale } from "@/i18n/routing";
import * as carRepository from "@/lib/repositories/car";
import type { CarFilters } from "@/lib/services/car/listing";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { publicCarDetail, publicCarSummary, type PublicCarDetail, type PublicCarRow, type PublicCarSummary } from "./projections";
import type { LinkSource } from "./urls";

/**
 * The public car search for readers outside the site (MCP): the site's own
 * engine and visibility, by words only. No embedding and no model call — a
 * search from anonymous AI traffic costs a database query, nothing more
 * (owner's decision, 2026-10-12). Arabic folding, synonyms and typo correction
 * still apply; they are the engine's, not a model's.
 */

/** How far one search may page. A real search reads the first pages; this bounds a crawl. */
export const PUBLIC_SEARCH_LIMITS = { defaultLimit: 10, maxLimit: 20, maxPage: 20, window: 400 } as const;

/**
 * Sorts both search paths order the same way. "best" is each path's own
 * default — relevance for words, newest without them; "newest" is left out
 * because the words path would ignore it.
 */
export const PUBLIC_SORTS = ["best", "priceAsc", "priceDesc", "yearAsc", "yearDesc", "mileageAsc", "mileageDesc", "oldest"] as const;
export type PublicSort = (typeof PUBLIC_SORTS)[number];

export interface PublicCarSearch {
  query?: string;
  make?: string[];
  bodyType?: string[];
  fuelType?: string[];
  transmission?: string[];
  color?: string;
  city?: string;
  /** A dealership's slug. */
  dealership?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  sort?: PublicSort;
  page?: number;
  limit?: number;
}

export interface PublicCarResults {
  cars: PublicCarSummary[];
  /** Matching cars, counted up to the window — past it a search is a crawl. */
  total: number;
  page: number;
  hasMore: boolean;
  /** Words the engine spelled differently, and what it searched for instead. */
  corrected?: { from: string; to: string[] }[];
  /** Words no public car has; the search went on without them. */
  missing?: string[];
}

interface SearchOutcome {
  cars: unknown[];
  pagination: { total: number };
  search?: { corrected?: { from: string; to: string[] }[]; missing?: string[] } | null;
}

function assertWithinLimits(page: number, limit: number) {
  const { maxLimit, maxPage, window } = PUBLIC_SEARCH_LIMITS;
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new ValidationError(`limit must be 1–${maxLimit}`, "limit");
  }
  if (!Number.isInteger(page) || page < 1 || page > maxPage || (page - 1) * limit >= window) {
    throw new ValidationError(`page is beyond the first ${window} results`, "page");
  }
}

export async function searchPublicCars(input: PublicCarSearch, locale: Locale, from?: LinkSource): Promise<PublicCarResults> {
  const page = input.page ?? 1;
  const limit = input.limit ?? PUBLIC_SEARCH_LIMITS.defaultLimit;
  assertWithinLimits(page, limit);

  // Public scope by construction: no organizationId, no status, no meaning —
  // the builders then apply visibility.ts's listed rule.
  const filters: CarFilters = {
    search: input.query?.trim() || undefined,
    make: input.make,
    bodyType: input.bodyType,
    fuelType: input.fuelType,
    transmission: input.transmission,
    color: input.color,
    city: input.city,
    dealership: input.dealership,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    minYear: input.minYear,
    maxYear: input.maxYear,
    minMileage: input.minMileage,
    maxMileage: input.maxMileage,
    sortBy: input.sort && input.sort !== "best" ? input.sort : undefined,
  };
  const result = (await carRepository.findManyCars(filters, { page, limit })) as SearchOutcome;

  const total = Math.min(result.pagination.total, PUBLIC_SEARCH_LIMITS.window);
  const corrected = result.search?.corrected ?? [];
  const missing = result.search?.missing ?? [];
  return {
    cars: (result.cars as PublicCarRow[]).map((car) => publicCarSummary(car, locale, from)),
    total,
    page,
    hasMore: page * limit < total,
    ...(corrected.length > 0 && { corrected }),
    ...(missing.length > 0 && { missing }),
  };
}

/** At most this many cars side by side; more is a list, not a comparison. */
export const MAX_COMPARED_CARS = 4;

export interface PublicComparison {
  cars: PublicCarDetail[];
  /** Ids asked for that are not public cars — hidden and missing alike. */
  notFound: string[];
}

/** Several public cars, in the order asked; the ids that are not public come back as notFound. */
export async function comparePublicCars(ids: string[], locale: Locale, from?: LinkSource): Promise<PublicComparison> {
  const unique = [...new Set(ids)];
  if (unique.length < 2 || unique.length > MAX_COMPARED_CARS) {
    throw new ValidationError(`compare 2–${MAX_COMPARED_CARS} cars`, "ids");
  }
  const rows = (await carRepository.findPublicCarsByIds(unique)) as unknown as PublicCarRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  return {
    cars: unique.flatMap((id) => (byId.has(id) ? [publicCarDetail(byId.get(id)!, locale, from)] : [])),
    notFound: unique.filter((id) => !byId.has(id)),
  };
}

/** One public car, or not found — the same answer for a hidden car and a missing id. */
export async function getPublicCar(id: string, locale: Locale, from?: LinkSource): Promise<PublicCarDetail> {
  const car = await carRepository.findPublicCarById(id);
  if (!car) throw new NotFoundError("Car");
  return publicCarDetail(car as PublicCarRow, locale, from);
}
