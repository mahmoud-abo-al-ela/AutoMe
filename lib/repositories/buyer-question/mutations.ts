// Buyer question repository - Data access layer for mutations
import { db } from "@/lib/prisma";

/** Open questions older than this are deleted when the car is next asked about. */
export const OPEN_QUESTION_RETENTION_DAYS = 90;
/**
 * New distinct questions stop being recorded on a car with this many open.
 * Repeats still count. The endpoint is public, so this is what stops one
 * visitor filling a dealer's inbox; the Arcjet buckets only slow them down.
 */
export const MAX_OPEN_QUESTIONS_PER_CAR = 50;

export interface DeclinedQuestion {
  organizationId: string;
  carId: string;
  question: string;
  questionKey: string;
  locale: string;
}

/**
 * Record a question the assistant declined, folding a repeat into its row.
 *
 * Both ids are server-sourced — the car's own row, never the request. A
 * repeat raises askCount and lastAskedAt without touching status, so a
 * question the dealer dismissed stays dismissed.
 */
export async function recordDeclinedQuestion(input: DeclinedQuestion) {
  const retentionCutoff = new Date(Date.now() - OPEN_QUESTION_RETENTION_DAYS * 86_400_000);

  // Pruned here rather than by a cron: the only place stale open questions
  // accumulate is a car still being asked about.
  await db.buyerQuestion.deleteMany({
    where: { carId: input.carId, status: "OPEN", lastAskedAt: { lt: retentionCutoff } },
  });

  const existing = await db.buyerQuestion.findUnique({
    where: { carId_questionKey: { carId: input.carId, questionKey: input.questionKey } },
    select: { id: true },
  });

  if (!existing) {
    const open = await db.buyerQuestion.count({
      where: { carId: input.carId, status: "OPEN" },
    });
    if (open >= MAX_OPEN_QUESTIONS_PER_CAR) return null;
  }

  // Upsert even after the check: two buyers asking the same new question at
  // once would otherwise race the unique index.
  return db.buyerQuestion.upsert({
    where: { carId_questionKey: { carId: input.carId, questionKey: input.questionKey } },
    create: input,
    update: { askCount: { increment: 1 }, lastAskedAt: new Date() },
  });
}

/**
 * Answer, or re-answer, a question. Scoped by organization in the WHERE, so
 * an id from another dealership matches nothing rather than being checked
 * after the fact. Returns the number of rows changed: 0 means not yours.
 */
export async function answerBuyerQuestion(input: {
  organizationId: string;
  id: string;
  answer: string;
  appliesToAllCars: boolean;
  answeredById: string;
}) {
  const { count } = await db.buyerQuestion.updateMany({
    where: { id: input.id, organizationId: input.organizationId },
    data: {
      status: "ANSWERED",
      answer: input.answer,
      appliesToAllCars: input.appliesToAllCars,
      answeredById: input.answeredById,
      answeredAt: new Date(),
    },
  });
  return count;
}

/**
 * Dismiss a question, or reopen one. Reopening clears the answer, so the
 * assistant stops citing it at once.
 */
export async function setBuyerQuestionStatus(input: {
  organizationId: string;
  id: string;
  status: "OPEN" | "DISMISSED";
}) {
  const { count } = await db.buyerQuestion.updateMany({
    where: { id: input.id, organizationId: input.organizationId },
    data:
      input.status === "OPEN"
        ? { status: "OPEN", answer: null, appliesToAllCars: false, answeredById: null, answeredAt: null }
        : { status: "DISMISSED" },
  });
  return count;
}
