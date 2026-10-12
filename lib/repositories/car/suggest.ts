// Car repository - what the search box suggests as a buyer types. Public
// listings only — available cars of active, undeleted dealerships — by the
// public search's own rule. Nothing here depends on who is asking.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { searchTerms } from "./search-query";
import { buildStructuredConditions } from "./search";
import { FROM } from "./search-words";

/** The public search's scope, with no tenant and no filter: what anyone may see. */
const PUBLIC = Prisma.sql`${FROM} WHERE ${Prisma.join(buildStructuredConditions({}), " AND ")}`;

export interface MakeModelCount {
  make: string;
  model: string;
  count: number;
}

/**
 * Every make and model listed publicly, with how many cars. One grouped scan:
 * there are far fewer pairs than cars, and the suggestions match them in
 * memory, by name in either language.
 */
export function countPublicMakeModels(): Promise<MakeModelCount[]> {
  return db.$queryRaw<MakeModelCount[]>(Prisma.sql`
    SELECT c."make", c."model", count(*)::int AS "count"
    ${PUBLIC}
    GROUP BY c."make", c."model"
  `);
}

export interface SpecCount {
  kind: "bodyType" | "fuelType" | "transmission" | "color" | "feature";
  value: string;
  count: number;
}

/**
 * How many public cars each spec leads to — counted the way choosing it
 * filters or searches, so a count is what the buyer then sees:
 *
 * - body type, fuel and gearbox by the stored value (the filters are exact);
 * - a colour by "contains", as the colour filter matches (`ILIKE %value%`);
 * - a feature by the search's own query for its name, synonyms included —
 *   the cars its search finds by words.
 *
 * Global counts: not narrowed by what was typed or by any filter.
 */
export async function countPublicSpecs(colors: string[], features: string[]): Promise<SpecCount[]> {
  const featureQueries = features.flatMap((name) => {
    const [term] = searchTerms(name);
    return term ? [{ name, query: term.query }] : [];
  });
  const featureCounts = featureQueries.map(
    ({ name, query }) => Prisma.sql`
      SELECT 'feature' AS "kind", ${name}::text AS "value", count(*)::int AS "count"
      ${PUBLIC} AND c."searchVector" @@ to_tsquery('simple', ${query})`
  );

  return db.$queryRaw<SpecCount[]>(Prisma.sql`
    SELECT 'bodyType' AS "kind", c."bodyType" AS "value", count(*)::int AS "count" ${PUBLIC} GROUP BY c."bodyType"
    UNION ALL
    SELECT 'fuelType', c."fuelType", count(*)::int ${PUBLIC} GROUP BY c."fuelType"
    UNION ALL
    SELECT 'transmission', c."transmission", count(*)::int ${PUBLIC} GROUP BY c."transmission"
    UNION ALL
    SELECT 'color', v."color", (
      SELECT count(*)::int ${PUBLIC} AND c."color" ILIKE '%' || v."color" || '%'
    )
    FROM unnest(${colors}::text[]) AS v("color")
    ${featureCounts.length > 0 ? Prisma.sql`UNION ALL ${Prisma.join(featureCounts, " UNION ALL ")}` : Prisma.empty}
  `);
}
