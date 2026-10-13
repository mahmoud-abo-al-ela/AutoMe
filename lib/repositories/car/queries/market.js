// The market around a car: comparable prices and the marketplace's live numbers.

import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { buildCarWhereClause } from "../filters";
import { PUBLIC_DEALERSHIP_SQL, publicCarWhere } from "../visibility";

/**
 * Asking prices of comparable cars on AutoMe, across every dealership: same
 * make, and the same model or the same body type, within `yearSpan` model
 * years either side. Prices only — the caller reduces them to a range, so no
 * other dealer's listing is ever named.
 *
 * @param {{ make: string, model?: string, bodyType?: string, year: number, yearSpan: number, excludeCarId: string, currency: string }} comparison
 */
export async function findComparablePrices({ make, model, bodyType, year, yearSpan, excludeCarId, currency }) {
  const rows = await db.car.findMany({
    where: {
      make: { equals: make, mode: "insensitive" },
      ...(model ? { model: { equals: model, mode: "insensitive" } } : {}),
      ...(bodyType ? { bodyType: { equals: bodyType, mode: "insensitive" } } : {}),
      year: { gte: year - yearSpan, lte: year + yearSpan },
      ...publicCarWhere("listed"),
      priceCurrency: currency,
      id: { not: excludeCarId },
    },
    select: { price: true },
    take: 500,
  });
  return rows.map((row) => Number(row.price));
}

/**
 * Every available car a page of listings could be compared against, in one
 * read: the same makes, within `yearSpan` of the page's model-year range.
 * The comparison ladder itself runs in memory (lib/services/car/market-price),
 * so a page of twelve cards costs one query rather than up to thirty-six
 * findComparablePrices calls.
 *
 * Like findComparablePrices, this crosses dealerships on purpose — a market
 * median is market data — and returns only what the comparison needs; no
 * dealership is selected.
 *
 * @param {{ makes: string[], minYear: number, maxYear: number, yearSpan: number, currency: string }} scope
 */
export async function findComparablePool({ makes, minYear, maxYear, yearSpan, currency }) {
  if (makes.length === 0) return [];
  const rows = await db.car.findMany({
    where: {
      make: { in: makes, mode: "insensitive" },
      year: { gte: minYear - yearSpan, lte: maxYear + yearSpan },
      ...publicCarWhere("listed"),
      priceCurrency: currency,
    },
    select: { id: true, make: true, model: true, bodyType: true, year: true, price: true },
    take: 5000,
  });
  return rows.map((row) => ({ ...row, price: Number(row.price) }));
}

/**
 * The live numbers the public site states about itself (Figma: MarketReadout)
 * — how many cars are on sale, from how many dealerships in how many cities,
 * their median asking price, and when the stock last changed. Computed, never
 * typed into copy.
 *
 * Scoped like a public listing: one dealership on its subdomain, otherwise
 * every active dealership. The median is Postgres's percentile_cont, so no
 * price rows leave the database; its WHERE mirrors buildCarWhereClause's
 * tenant and availability rules.
 *
 * @param {{ organizationId?: string | null, currency: string }} scope
 */
export async function getMarketSummary({ organizationId = null, currency }) {
  const where = buildCarWhereClause(organizationId ? { organizationId } : {});
  const tenant = organizationId
    ? Prisma.sql`c."organizationId" = ${organizationId} AND ${PUBLIC_DEALERSHIP_SQL}`
    : PUBLIC_DEALERSHIP_SQL;

  const [listings, dealerships, cities, medianRows, latest] = await Promise.all([
    db.car.count({ where }),
    db.car.groupBy({ by: ["organizationId"], where }),
    db.organization.findMany({
      where: { city: { not: null }, cars: { some: where } },
      select: { city: true },
      distinct: ["city"],
    }),
    db.$queryRaw(Prisma.sql`
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY c."price")::float AS median
      FROM "Car" c
      JOIN "Organization" o ON o."id" = c."organizationId"
      WHERE c."status" = 'AVAILABLE' AND c."priceCurrency" = ${currency} AND ${tenant}
    `),
    db.car.aggregate({ where, _max: { updatedAt: true } }),
  ]);

  const median = medianRows[0]?.median;
  return {
    listings,
    dealerships: dealerships.length,
    cities: cities.length,
    medianPrice: median == null ? null : Math.round(median),
    updatedAt: latest._max.updatedAt,
  };
}
