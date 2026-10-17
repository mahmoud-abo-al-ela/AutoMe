// Assistant answer repository - Data access layer for queries
import { db } from "@/lib/prisma";

// Reads the replies the server stored, never text from the page: a browser-written history is attacker-written.
export function findRepliesForHistory(input: { ids: string[]; carId: string; since: Date }) {
  if (input.ids.length === 0) return Promise.resolve([]);
  return db.assistantAnswer.findMany({
    where: { id: { in: input.ids }, carId: input.carId, createdAt: { gte: input.since } },
    orderBy: { createdAt: "asc" },
    select: { question: true, answer: true, outcome: true },
  });
}
