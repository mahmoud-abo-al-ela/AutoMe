// Assistant answer repository - Data access layer for mutations
import { db } from "@/lib/prisma";
import type { AssistantOutcome } from "@/lib/generated/prisma";

/** Answers older than this are deleted when the car is next answered about. */
export const ASSISTANT_ANSWER_RETENTION_DAYS = 90;

export interface AnswerToKeep {
  organizationId: string;
  carId: string;
  question: string;
  /** What the buyer was shown; "" when it was the page's fixed copy. */
  answer: string;
  locale: string;
  outcome: AssistantOutcome;
  /** Where the reply came from — see AiCallMeta. */
  aiUsageId: string | null;
  model: string | null;
  promptVersion: string | null;
  fieldsUsed: string[];
}

/**
 * Keep a reply the buyer was shown, and return its id: an answer so they can
 * rate it, a decline or off-topic reply so the quality report can count it.
 * Both ids are server-sourced — the car's own row, never the request.
 * Pruned here rather than by a cron, like buyer questions: the only place old
 * replies pile up is a car still being asked about. Only on an answer, so a
 * decline or an off-topic message costs one write; the next answer prunes it.
 */
export async function recordAssistantAnswer(input: AnswerToKeep): Promise<string> {
  if (input.outcome === "ANSWERED") {
    const cutoff = new Date(Date.now() - ASSISTANT_ANSWER_RETENTION_DAYS * 86_400_000);
    await db.assistantAnswer.deleteMany({
      where: { carId: input.carId, createdAt: { lt: cutoff } },
    });
  }
  const row = await db.assistantAnswer.create({ data: input, select: { id: true } });
  return row.id;
}

/**
 * Rate an answer, once. Returns the answer when this call rated it, or null
 * when it does not exist, was already rated, or was not an answer — so a second
 * click, or anyone replaying the request, changes nothing and files nothing.
 */
export async function rateAssistantAnswer(id: string, helpful: boolean) {
  const { count } = await db.assistantAnswer.updateMany({
    where: { id, helpful: null, outcome: "ANSWERED" },
    data: { helpful, ratedAt: new Date() },
  });
  if (count === 0) return null;
  return db.assistantAnswer.findUnique({
    where: { id },
    select: { organizationId: true, carId: true, question: true, locale: true },
  });
}
