// Car repository - the search's vocabulary (the car_search_terms materialized
// view, 20261013120000): the words of every publicly listed car, folded.
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * The lowest similarity a caller may ask for. `word % token` is what lets the
 * trigram index answer, and it only passes words at or above pg_trgm's own
 * threshold (0.3 unless the session changes it), so a lower floor would
 * silently behave as 0.3.
 */
export const MIN_WORD_SIMILARITY = 0.3;

/** A known word near one the buyer typed. */
export interface SimilarWord {
  token: string;
  word: string;
  similarity: number;
  /** Public cars with the word, when the vocabulary was last refreshed. */
  ndoc: number;
}

/**
 * Recompute the vocabulary. CONCURRENTLY, so searches keep reading the old
 * one meanwhile; a second refresh waits for the first rather than failing.
 * Recomputes everything, so running it twice is harmless.
 */
export async function refreshSearchTerms(): Promise<void> {
  await db.$transaction([
    // Bounded here rather than by the connection: the pooler may hand any
    // session to the next caller, and SET LOCAL ends with the transaction.
    db.$executeRaw`SET LOCAL statement_timeout = '120s'`,
    db.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY car_search_terms`,
  ]);
}

/**
 * For each token (already folded, as `searchWords` returns them), the known
 * words most like it by spelling, best first — then the more common word.
 * Only proposals: whether a word is in the searcher's scope is for the search
 * to check.
 */
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
