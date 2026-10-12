// Car repository - what the search box suggests as a buyer types. Public
// listings only, by the same rule the public search applies: available cars
// of active, undeleted dealerships. Nothing here depends on who is asking.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

const PUBLIC = Prisma.sql`
  FROM "Car" c JOIN "Organization" o ON o."id" = c."organizationId"
  WHERE c."status" = 'AVAILABLE' AND o."isActive" AND o."deletedAt" IS NULL`;

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

export interface WordCount {
  word: string;
  count: number;
}

/**
 * Words of the search's vocabulary starting with `prefix` (folded, as
 * `searchWords` returns it), the most common first, each with how many public
 * cars have it now. The vocabulary only proposes; the count is live, so a word
 * no public car has any more is never offered. A lexeme can hold punctuation
 * ("x5-like"), so it is quoted before it reaches to_tsquery.
 */
export function findWordsByPrefix(prefix: string, limit: number): Promise<WordCount[]> {
  return db.$queryRaw<WordCount[]>(Prisma.sql`
    SELECT w."word", counted."count"
    FROM (
      SELECT "word", "ndoc"
      FROM car_search_terms
      WHERE "word" LIKE ${`${prefix.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`}
      ORDER BY "ndoc" DESC, "word"
      LIMIT ${limit}
    ) w
    CROSS JOIN LATERAL (
      SELECT count(*)::int AS "count"
      ${PUBLIC}
        AND c."searchVector" @@ to_tsquery('simple', quote_literal(w."word") || ':*')
    ) counted
    WHERE counted."count" > 0
    ORDER BY counted."count" DESC, w."word"
  `);
}
