// Buyer question repository - meaning-based reads and writes (pgvector)
import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { toVectorLiteral } from "@/lib/ai/embeddings";

/**
 * Everything here is raw SQL: Prisma cannot read or write a vector column.
 * Every query is scoped by organizationId in its WHERE (tenant isolation),
 * and only ever compares vectors made by the same model.
 *
 * Similarity is cosine similarity, 1 − (a <=> b): 1 is the same meaning, and
 * unrelated questions about a car sit around 0.6.
 */

const vector = (values: number[]) => Prisma.sql`${toVectorLiteral(values)}::vector`;

/** The question a job embeds, or null when it no longer exists. */
export function findQuestionForEmbedding(id: string, organizationId: string) {
  return db.buyerQuestion.findFirst({
    where: { id, organizationId },
    select: { id: true, organizationId: true, carId: true, question: true, status: true, embeddingModel: true, createdAt: true },
  });
}

export async function setQuestionEmbedding(input: { id: string; organizationId: string; vector: number[]; model: string }) {
  await db.$executeRaw`
    UPDATE "BuyerQuestion"
    SET "embedding" = ${vector(input.vector)}, "embeddingModel" = ${input.model}
    WHERE "id" = ${input.id} AND "organizationId" = ${input.organizationId}`;
}

/**
 * The closest earlier question on the same car — open or answered, never
 * dismissed — by the same model, with how close it is. Earlier only, so two
 * rephrasings embedded at once fold one way, into the older.
 */
export async function findNearestEarlierQuestion(input: {
  organizationId: string;
  carId: string;
  excludeId: string;
  before: Date;
  vector: number[];
  model: string;
}): Promise<{ id: string; similarity: number } | null> {
  const [row] = await db.$queryRaw<{ id: string; similarity: number }[]>`
    SELECT "id", 1 - ("embedding" <=> ${vector(input.vector)}) AS similarity
    FROM "BuyerQuestion"
    WHERE "organizationId" = ${input.organizationId}
      AND "carId" = ${input.carId}
      AND "id" <> ${input.excludeId}
      AND "createdAt" < ${input.before}
      AND "status" IN ('OPEN', 'ANSWERED')
      AND "embeddingModel" = ${input.model}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${vector(input.vector)}
    LIMIT 1`;
  return row ? { id: row.id, similarity: Number(row.similarity) } : null;
}

/**
 * Fold a rephrased repeat into the question it repeats: its asks are added to
 * that one's count, the later of the two "last asked" kept, and the repeat
 * removed — only while it is still open, so an answer is never thrown away.
 * Returns whether it folded.
 */
export async function foldQuestionInto(input: { fromId: string; intoId: string; organizationId: string }): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const [from, into] = await Promise.all([
      tx.buyerQuestion.findFirst({
        where: { id: input.fromId, organizationId: input.organizationId, status: "OPEN" },
        select: { askCount: true, lastAskedAt: true },
      }),
      tx.buyerQuestion.findFirst({
        where: { id: input.intoId, organizationId: input.organizationId },
        select: { lastAskedAt: true },
      }),
    ]);
    if (!from || !into) return false;
    // Deleted only if it is still open at the moment of deleting: a dealer
    // who answers it while this runs keeps their answer, and nothing folds.
    const { count } = await tx.buyerQuestion.deleteMany({
      where: { id: input.fromId, organizationId: input.organizationId, status: "OPEN" },
    });
    if (count === 0) return false;
    await tx.buyerQuestion.update({
      where: { id: input.intoId },
      data: {
        askCount: { increment: from.askCount },
        lastAskedAt: from.lastAskedAt > into.lastAskedAt ? from.lastAskedAt : into.lastAskedAt,
      },
    });
    return true;
  });
}

/**
 * The dealer's answers for one car, closest in meaning to a buyer's question
 * first — for a car with more answers than fit in the record. Answers with no
 * vector yet (not backfilled) come after, most-asked first.
 */
export function findAnswersForCarByMeaning(input: {
  carId: string;
  organizationId: string;
  vector: number[];
  model: string;
  take: number;
}) {
  return db.$queryRaw<{ question: string; answer: string | null; appliesToAllCars: boolean }[]>`
    SELECT "question", "answer", "appliesToAllCars"
    FROM "BuyerQuestion"
    WHERE "organizationId" = ${input.organizationId}
      AND "status" = 'ANSWERED'
      AND ("carId" = ${input.carId} OR "appliesToAllCars" = true)
    ORDER BY
      CASE WHEN "embeddingModel" = ${input.model} THEN "embedding" <=> ${vector(input.vector)} END ASC NULLS LAST,
      "askCount" DESC
    LIMIT ${input.take}`;
}

/**
 * For each open question, the closest answered question on another of the
 * dealership's cars — to offer that answer again. Callers apply the
 * threshold; this returns the nearest whatever its distance.
 */
export async function findAnswerSuggestions(organizationId: string, questionIds: string[]) {
  if (questionIds.length === 0) return [];
  const rows = await db.$queryRaw<
    { questionId: string; sourceId: string; question: string; answer: string; appliesToAllCars: boolean; similarity: number }[]
  >`
    SELECT q."id" AS "questionId", s."id" AS "sourceId", s."question", s."answer", s."appliesToAllCars",
           1 - (s."embedding" <=> q."embedding") AS similarity
    FROM "BuyerQuestion" q
    CROSS JOIN LATERAL (
      SELECT "id", "question", "answer", "appliesToAllCars", "embedding"
      FROM "BuyerQuestion" s
      WHERE s."organizationId" = q."organizationId"
        AND s."status" = 'ANSWERED'
        AND s."answer" IS NOT NULL
        AND s."carId" <> q."carId"
        AND s."embeddingModel" = q."embeddingModel"
        AND s."embedding" IS NOT NULL
      ORDER BY s."embedding" <=> q."embedding"
      LIMIT 1
    ) s
    WHERE q."organizationId" = ${organizationId}
      AND q."id" IN (${Prisma.join(questionIds)})
      AND q."embedding" IS NOT NULL`;
  return rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
}

/** Questions with no vector from this model yet — the backfill's next batch. */
export function findQuestionsMissingEmbedding(model: string, take: number, after?: string) {
  return db.buyerQuestion.findMany({
    where: {
      OR: [{ embeddingModel: null }, { embeddingModel: { not: model } }],
      ...(after && { id: { gt: after } }),
    },
    orderBy: { id: "asc" },
    take,
    select: { id: true, organizationId: true, question: true },
  });
}
