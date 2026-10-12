// Car repository - the filter panel's counts for a search with text, taken
// over the very cars its results are made of.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { toVectorLiteral } from "@/lib/ai/embeddings";
import { logError } from "@/lib/utils/errors";
import { SEMANTIC_MIN_SIMILARITY, SEMANTIC_WITHIN_BEST } from "@/lib/search/hybrid";
import type { CarFilters } from "@/lib/services/car/listing";
import { SELECTABLE_FILTERS, buildStructuredConditions, selectableCondition } from "./search";
import { FROM, analyzeTerms } from "./search-words";
import { searchTerms } from "./search-query";

/** The filters whose options are counted value by value. */
const COUNTED = ["make", "bodyType", "fuelType", "transmission", "color"] as const;
type Counted = (typeof COUNTED)[number];

export interface FacetOption {
  value: string;
  count: number;
}

export interface SearchFacets {
  /** Cars the results hold: every filter applied, and the search's words or meaning. */
  total: number;
  counts: Record<Counted, FacetOption[]>;
  priceRange: { min: number; max: number };
  dealerships: { name: string; slug: string; logo: string | null }[];
  cities: string[];
}

interface FacetRow {
  facet: string;
  value: string | null;
  count: number;
  name: string | null;
  logo: string | null;
}

/**
 * The filter panel's options for a search with text, counted over the cars
 * the search's results are made of — the same words judged the same way
 * (analyzeTerms: missing, corrected, names), the same cars found by meaning,
 * the same tenant and visibility. Before this, the counts matched each word
 * with `contains`, so an Arabic search, a set-aside word or a typo showed
 * counts that disagreed with the results beside them.
 *
 * Each filter's options are counted with every other filter applied but not
 * its own, as the panel has always counted: a selected make's count is the
 * results' total, and an unselected one's is what choosing it would add.
 *
 * Meaning counts a car in when it is as close as the results require: the
 * same floor and the same distance from the best match, the best taken among
 * the results' own cars, so a selected value's count stays the total. Not
 * mirrored: the results also stop at the HYBRID_CANDIDATES closest cars,
 * which no search reaches at today's size. And for an option not yet chosen,
 * the count predicts at the present threshold; choosing it can move the best
 * match, and with it the threshold.
 *
 * Without the meaning (no pgvector, a failed query), counted by the words
 * alone — as the results then are.
 */
export async function searchFacets(filters: CarFilters): Promise<SearchFacets> {
  if (filters.meaning) {
    try {
      return await countFacets(filters, filters.meaning);
    } catch (error) {
      logError("Counting search facets by meaning failed; counting by words alone", error);
    }
  }
  return countFacets(filters, null);
}

async function countFacets(filters: CarFilters, meaning: CarFilters["meaning"]): Promise<SearchFacets> {
  const lexical = await analyzeTerms(buildStructuredConditions(filters), searchTerms(filters.search ?? ""), {
    correct: filters.exact !== true,
  });

  // The scope with no selectable filter applied; each filter becomes a flag.
  const unselected = Object.fromEntries(SELECTABLE_FILTERS.map((field) => [field, undefined]));
  const where = Prisma.join(buildStructuredConditions({ ...filters, ...unselected }), " AND ");
  const flag = (field: string) => selectableCondition(field, filters) ?? Prisma.sql`true`;
  const flags = Prisma.join(
    SELECTABLE_FILTERS.map((field) => Prisma.sql`${flag(field)} AS ${Prisma.raw(`"f_${field}"`)}`),
    ", "
  );
  const allBut = (except: string | null) =>
    Prisma.join(
      SELECTABLE_FILTERS.filter((field) => field !== except).map((field) => Prisma.raw(`"f_${field}"`)),
      " AND "
    );

  const words = lexical.match ?? Prisma.sql`false`;
  const closeness = meaning
    ? Prisma.sql`CASE WHEN c."embeddingModel" = ${meaning.model} AND c."embedding" IS NOT NULL
        THEN 1 - (c."embedding" <=> ${toVectorLiteral(meaning.vector)}::vector) END`
    : Prisma.sql`NULL::float8`;

  const marked = Prisma.sql`
    WITH base AS (
      SELECT c."make", c."bodyType", c."fuelType", c."transmission", c."color", c."price",
             o."name" AS "orgName", o."slug" AS "orgSlug", o."logo" AS "orgLogo", o."city" AS "orgCity",
             ${flags},
             (${words}) AS "f_words",
             ${closeness} AS "s"
      ${FROM}
      WHERE ${where}
    ),
    threshold AS (
      SELECT GREATEST(${SEMANTIC_MIN_SIMILARITY}::float8, max("s") - ${SEMANTIC_WITHIN_BEST}::float8) AS "v"
      FROM base
      WHERE ${allBut(null)}
    ),
    marked AS (
      SELECT base.*, ("f_words" OR coalesce("s" >= (SELECT "v" FROM threshold), false)) AS "f_text"
      FROM base
    )`;

  const counted = COUNTED.map(
    (field) => Prisma.sql`
      SELECT ${field}::text AS "facet", ${Prisma.raw(`"${field}"`)}::text AS "value", count(*)::int AS "count",
             NULL::text AS "name", NULL::text AS "logo"
      FROM marked WHERE "f_text" AND ${allBut(field)}
      GROUP BY ${Prisma.raw(`"${field}"`)}`
  );

  const [rows, [range]] = await Promise.all([
    db.$queryRaw<FacetRow[]>(Prisma.sql`
      ${marked}
      ${Prisma.join(counted, " UNION ALL ")}
      UNION ALL
      SELECT 'dealership', "orgSlug", count(*)::int, "orgName", "orgLogo"
      FROM marked WHERE "f_text" AND ${allBut("dealership")}
      GROUP BY "orgSlug", "orgName", "orgLogo"
      UNION ALL
      SELECT 'city', "orgCity", count(*)::int, NULL, NULL
      FROM marked WHERE "f_text" AND ${allBut("city")}
      GROUP BY "orgCity"
    `),
    db.$queryRaw<{ total: number; min: string | null; max: string | null }[]>(Prisma.sql`
      ${marked}
      SELECT count(*)::int AS "total", min("price")::text AS "min", max("price")::text AS "max"
      FROM marked WHERE "f_text" AND ${allBut(null)}
    `),
  ]);

  const present = (row: FacetRow): row is FacetRow & { value: string } => row.value !== null && row.value !== "";
  const counts = Object.fromEntries(
    COUNTED.map((field) => [
      field,
      rows
        .filter((row) => row.facet === field && present(row))
        .map((row) => ({ value: row.value as string, count: row.count }))
        .sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0)),
    ])
  ) as Record<Counted, FacetOption[]>;

  return {
    total: range?.total ?? 0,
    counts,
    priceRange: {
      min: range?.min ? parseFloat(range.min) : 0,
      max: range?.max ? parseFloat(range.max) : 1000000,
    },
    dealerships: filters.organizationId
      ? []
      : rows
          .filter((row) => row.facet === "dealership" && present(row))
          .map((row) => ({ name: row.name ?? "", slug: row.value as string, logo: row.logo }))
          .sort((a, b) => a.name.localeCompare(b.name)),
    cities: filters.organizationId
      ? []
      : rows
          .filter((row) => row.facet === "city" && present(row))
          .map((row) => row.value as string)
          .sort(),
  };
}
