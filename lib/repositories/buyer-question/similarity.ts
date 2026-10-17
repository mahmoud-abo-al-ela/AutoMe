// Buyer question repository - meaning-based reads and writes (pgvector)
import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { toVectorLiteral } from "@/lib/ai/embeddings";

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

export async function findNearestEarlierQuestion(input: {
  organizationId: string;
  carId: string;
  excludeId: string;
  before: Date;
  vector: number[];
  model: string;
  statuses: ("OPEN" | "ANSWERED")[];
}): Promise<{ id: string; similarity: number } | null> {
  const [row] = await db.$queryRaw<{ id: string; similarity: number }[]>`
    SELECT "id", 1 - ("embedding" <=> ${vector(input.vector)}) AS similarity
    FROM "BuyerQuestion"
    WHERE "organizationId" = ${input.organizationId}
      AND "carId" = ${input.carId}
      AND "id" <> ${input.excludeId}
      AND "createdAt" < ${input.before}
      AND "status"::text IN (${Prisma.join(input.statuses)})
      AND "embeddingModel" = ${input.model}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${vector(input.vector)}
    LIMIT 1`;
  return row ? { id: row.id, similarity: Number(row.similarity) } : null;
}

export async function linkRelatedQuestion(input: { id: string; relatedId: string; organizationId: string }) {
  await db.buyerQuestion.updateMany({
    where: { id: input.id, organizationId: input.organizationId, NOT: { id: input.relatedId } },
    data: { relatedQuestionId: input.relatedId },
  });
}

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
