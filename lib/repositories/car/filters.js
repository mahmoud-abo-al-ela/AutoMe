// Car filter/query builder functions
import { CAR_STATUS } from "@/lib/constants/car-options";

/**
 * Normalize a filter value that may be a single value or an array.
 * Returns undefined for empty, a scalar for one value, or an array for many.
 */
function normalizeMulti(value) {
  if (value === undefined || value === null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  const cleaned = arr.filter((v) => v !== undefined && v !== null && v !== "");
  if (cleaned.length === 0) return undefined;
  return cleaned;
}

/**
 * Build an exact-match clause that supports both single and multi values.
 */
function matchClause(value) {
  const normalized = normalizeMulti(value);
  if (normalized === undefined) return undefined;
  return normalized.length === 1 ? normalized[0] : { in: normalized };
}

/**
 * Build where clause from filters
 */
export function buildCarWhereClause(filters) {
  const where = {};
  const organizationWhere = {};

  // Organization filter (CRITICAL for multi-tenancy)
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  } else {
    organizationWhere.isActive = true;
    organizationWhere.deletedAt = null;

    if (filters.dealership) {
      organizationWhere.slug = filters.dealership;
    }

    if (filters.city) {
      organizationWhere.city = { equals: filters.city, mode: "insensitive" };
    }
  }

  // Status filter (default to AVAILABLE for public listings)
  if (filters.status !== undefined) {
    where.status = filters.status;
  } else if (filters.onlyAvailable !== false) {
    where.status = CAR_STATUS.AVAILABLE;
  }

  // Search filter — matches make/model/description/title/bodyType, a 4-digit
  // year, and features. Kept broad so "SUV", "2021", etc. return results.
  if (filters.search && filters.search.trim() !== "") {
    const term = filters.search.trim();
    const or = [
      { make: { contains: term, mode: "insensitive" } },
      { model: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { bodyType: { contains: term, mode: "insensitive" } },
      { features: { hasSome: [term] } },
    ];

    const yearMatch = term.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      or.push({ year: Number(yearMatch[0]) });
    }

    where.OR = or;
  }

  // Exact match filters (single or multi)
  const make = matchClause(filters.make);
  if (make !== undefined) where.make = make;

  const bodyType = matchClause(filters.bodyType);
  if (bodyType !== undefined) where.bodyType = bodyType;

  const fuelType = matchClause(filters.fuelType);
  if (fuelType !== undefined) where.fuelType = fuelType;

  const transmission = matchClause(filters.transmission);
  if (transmission !== undefined) where.transmission = transmission;

  // Color filter — case-insensitive `contains` so "blue" matches "Navy Blue".
  // color is low-cardinality, so scanning it is cheap even without using the
  // exact-match index. Previously the ?color= param (pushed by image search) was
  // silently dropped here.
  if (filters.color && filters.color.trim() !== "") {
    where.color = { contains: filters.color.trim(), mode: "insensitive" };
  }

  // Minimum seats ("7-seater").
  if (filters.minSeats !== undefined && filters.minSeats !== null) {
    where.seats = { gte: filters.minSeats };
  }

  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  // Year range filter
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.year = {};
    if (filters.minYear !== undefined) where.year.gte = filters.minYear;
    if (filters.maxYear !== undefined) where.year.lte = filters.maxYear;
  }

  // Mileage range filter
  if (filters.minMileage !== undefined || filters.maxMileage !== undefined) {
    where.mileage = {};
    if (filters.minMileage !== undefined) where.mileage.gte = filters.minMileage;
    if (filters.maxMileage !== undefined) where.mileage.lte = filters.maxMileage;
  }

  // Featured filter
  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  if (Object.keys(organizationWhere).length > 0) {
    where.organization = { is: organizationWhere };
  }

  return where;
}

/**
 * Build order by clause
 */
export function buildCarOrderBy(sortBy = "newest") {
  const sortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    priceAsc: { price: "asc" },
    priceDesc: { price: "desc" },
    yearAsc: { year: "asc" },
    yearDesc: { year: "desc" },
    mileageAsc: { mileage: "asc" },
    mileageDesc: { mileage: "desc" },
  };

  return sortMap[sortBy] || sortMap.newest;
}
