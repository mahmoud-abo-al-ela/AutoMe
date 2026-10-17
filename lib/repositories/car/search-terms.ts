// Car repository - the search's vocabulary (the car_search_terms materialized
// view, 20261013120000): the words of every publicly listed car, folded.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

const MIN_WORD_SIMILARITY = 0.3;

/** A known word near one the buyer typed. */
export interface SimilarWord {
  token: string;
  word: string;
  similarity: number;
  /** Public cars with the word, when the vocabulary was last refreshed. */
  ndoc: number;
}

export async function refreshSearchTerms(): Promise<void> {
  await db.$transaction([
    // Bounded here rather than by the connection: the pooler may hand any
    // session to the next caller, and SET LOCAL ends with the transaction.
    db.$executeRaw`SET LOCAL statement_timeout = '120s'`,
    db.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY car_search_terms`,
  ]);
}

export async function findSimilarWords(
  tokens: string[],
  { minSimilarity, perToken }: { minSimilarity: number; perToken: number }
): Promise<SimilarWord[]> {
  if (tokens.length === 0) return [];
  if (minSimilarity < MIN_WORD_SIMILARITY) {
    throw new RangeError(`minSimilarity must be at least ${MIN_WORD_SIMILARITY}`);
  }

  const rows = await db.$queryRaw<{ token: string; word: string; similarity: number; ndoc: number }[]>(Prisma.sql`
    SELECT t."token", w."word", w."similarity", w."ndoc"
    FROM unnest(${tokens}::text[]) AS t("token")
    CROSS JOIN LATERAL (
      SELECT "word", similarity("word", t."token")::float8 AS "similarity", "ndoc"::int AS "ndoc"
      FROM car_search_terms
      WHERE "word" % t."token" AND "word" <> t."token"
      ORDER BY similarity("word", t."token") DESC, "ndoc" DESC, "word"
      LIMIT ${perToken}
    ) w
    WHERE w."similarity" >= ${minSimilarity}
  `);
  return rows;
}

export async function findSimilarNames(
  tokens: string[],
  names: string[],
  { minSimilarity, perToken }: { minSimilarity: number; perToken: number }
): Promise<SimilarWord[]> {
  if (tokens.length === 0 || names.length === 0) return [];
  if (minSimilarity < MIN_WORD_SIMILARITY) {
    throw new RangeError(`minSimilarity must be at least ${MIN_WORD_SIMILARITY}`);
  }

  return db.$queryRaw<SimilarWord[]>(Prisma.sql`
    SELECT t."token", n."word", n."similarity", 0 AS "ndoc"
    FROM unnest(${tokens}::text[]) AS t("token")
    CROSS JOIN LATERAL (
      SELECT "word", similarity("word", t."token")::float8 AS "similarity"
      FROM unnest(${names}::text[]) AS known("word")
      WHERE "word" % t."token" AND "word" <> t."token"
      ORDER BY similarity("word", t."token") DESC, "word"
      LIMIT ${perToken}
    ) n
    WHERE n."similarity" >= ${minSimilarity}
  `);
}
