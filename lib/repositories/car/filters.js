// Car filter/query builder functions
import { CAR_STATUS } from "@/lib/constants/car-options";
import { expandSearchTerm } from "@/lib/locations";

/**
 * A car is in a place because its dealership is: `Organization.region` holds
 * the governorate code and `Organization.city` the slug, and neither can be
 * reached by substring-matching a car row. Without this the only route from
 * "القاهرة" to a car was whatever a dealer happened to type into the free-text
 * location field.
 */
const matchesDealershipPlace = (canonicals) =>
  canonicals.flatMap((value) => [
    { organization: { city: { equals: value, mode: "insensitive" } } },
    { organization: { region: { equals: value, mode: "insensitive" } } },
  ]);

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
      // Each token also matches the English value it is displayed as, so a
      // reader who sees "نيسان" on a filter chip can type it into the search
      // box and find the Nissans. Without this the columns hold only English,
      // and an Arabic query matched nothing.
      const { exact, text } = expandSearchTerm(token);

      const or = text.flatMap((term) => [
        { make: { contains: term, mode: "insensitive" } },
        { model: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
        // The bilingual columns belong here too, or the dealer's own inventory
        // search finds a car by its English title while the public listing
        // finds it by either. This branch still does not fold Arabic — that is
        // the pre-existing gap the queries/search unification has to close.
        { titleEn: { contains: term, mode: "insensitive" } },
        { titleAr: { contains: term, mode: "insensitive" } },
        { descriptionEn: { contains: term, mode: "insensitive" } },
        { descriptionAr: { contains: term, mode: "insensitive" } },
        { bodyType: { contains: term, mode: "insensitive" } },
        { fuelType: { contains: term, mode: "insensitive" } },
        { transmission: { contains: term, mode: "insensitive" } },
        { color: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        { features: { has: term } },
        { featuresAr: { has: term } },
      ]);

      or.push(...matchesDealershipPlace(exact));

      if (/^(19|20)\d{2}$/.test(token)) {
        or.push({ year: Number(token) });
      }
      return { OR: or };
    });

    // A multi-word place is a single stored value that no individual word
    // matches, so the whole phrase is tried against the dealership's columns
    // as well — "المحلة الكبرى" is one city, not two words.
    const phraseClauses = matchesDealershipPlace(
      expandSearchTerm(filters.search.trim()).exact
    );

    // Merge into any existing AND rather than overwriting it, so this stays
    // correct if another builder above ever adds its own AND clause.
    if (tokenClauses.length > 0) {
      const searchClause =
        phraseClauses.length > 0
          ? [{ OR: [{ AND: tokenClauses }, { OR: phraseClauses }] }]
          : tokenClauses;

      where.AND = [...(where.AND ?? []), ...searchClause];
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
