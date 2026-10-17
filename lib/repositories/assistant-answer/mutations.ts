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
