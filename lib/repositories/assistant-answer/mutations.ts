// Assistant answer repository - Data access layer for mutations
import { db } from "@/lib/prisma";

/** Answers older than this are deleted when the car is next answered about. */
export const ASSISTANT_ANSWER_RETENTION_DAYS = 90;

export interface AnswerToKeep {
  organizationId: string;
  carId: string;
  question: string;
  answer: string;
  locale: string;
}

/**
 * Keep an answer the buyer was shown, so they can rate it, and return its id.
 * Both ids are server-sourced — the car's own row, never the request.
 * Pruned here rather than by a cron, like buyer questions: the only place old
 * answers pile up is a car still being asked about.
 */
export async function recordAssistantAnswer(input: AnswerToKeep): Promise<string> {
  const cutoff = new Date(Date.now() - ASSISTANT_ANSWER_RETENTION_DAYS * 86_400_000);
  await db.assistantAnswer.deleteMany({
    where: { carId: input.carId, createdAt: { lt: cutoff } },
  });
  const row = await db.assistantAnswer.create({ data: input, select: { id: true } });
  return row.id;
}

/**
 * Rate an answer, once. Returns the answer when this call rated it, or null
 * when it does not exist or was already rated — so a second click, or anyone
 * replaying the request, changes nothing and files nothing.
 */
export async function rateAssistantAnswer(id: string, helpful: boolean) {
  const { count } = await db.assistantAnswer.updateMany({
    where: { id, helpful: null },
    data: { helpful, ratedAt: new Date() },
  });
  if (count === 0) return null;
  return db.assistantAnswer.findUnique({
    where: { id },
    select: { organizationId: true, carId: true, question: true, locale: true },
  });
}
