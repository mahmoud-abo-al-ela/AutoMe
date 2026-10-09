// Assistant answer repository - Data access layer for queries
import { db } from "@/lib/prisma";

/**
 * Earlier replies the page names by id, for reading a follow-up question —
 * oldest first. Scoped to the car being asked about and to `since`, so an id
 * from another listing or an old visit matches nothing. The text is what the
 * server stored, never what the page sends: a conversation the browser could
 * write is a conversation an attacker could write.
 */
export function findRepliesForHistory(input: { ids: string[]; carId: string; since: Date }) {
  if (input.ids.length === 0) return Promise.resolve([]);
  return db.assistantAnswer.findMany({
    where: { id: { in: input.ids }, carId: input.carId, createdAt: { gte: input.since } },
    orderBy: { createdAt: "asc" },
    select: { question: true, answer: true, outcome: true },
  });
}
