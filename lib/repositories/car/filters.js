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

  // Search filter — tokenized so multi-word queries work: split on whitespace,
  // then AND the tokens together while each token is OR'd across the searchable
  // columns. So "Toyota Corolla" matches make=Toyota AND model=Corolla (a single
  // `contains "Toyota Corolla"` matched neither column). Each token also matches
  // a 4-digit year and a feature tag. Token count is capped to bound query cost.
  if (filters.search && filters.search.trim() !== "") {
    const tokens = filters.search.trim().split(/\s+/).slice(0, 6);
    const tokenClauses = tokens.map((token) => {
      const or = [
        { make: { contains: token, mode: "insensitive" } },
        { model: { contains: token, mode: "insensitive" } },
        { description: { contains: token, mode: "insensitive" } },
        { title: { contains: token, mode: "insensitive" } },
        { bodyType: { contains: token, mode: "insensitive" } },
        { fuelType: { contains: token, mode: "insensitive" } },
        { transmission: { contains: token, mode: "insensitive" } },
        { color: { contains: token, mode: "insensitive" } },
        { location: { contains: token, mode: "insensitive" } },
        { features: { has: token } },
      ];
      if (/^(19|20)\d{2}$/.test(token)) {
        or.push({ year: Number(token) });
      }
      return { OR: or };
    });

    // Merge into any existing AND rather than overwriting it, so this stays
    // correct if another builder above ever adds its own AND clause.
    if (tokenClauses.length > 0) {
      where.AND = [...(where.AND ?? []), ...tokenClauses];
    }
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
