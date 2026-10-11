// AI trace repository - Data access layer
import { db } from "@/lib/prisma";

/** Traces older than this are pruned; a debug record, not an archive. */
export const AI_TRACE_RETENTION_DAYS = 14;

export interface TraceToKeep {
  aiUsageId: string | null;
  feature: string;
  model: string;
  promptVersion: string;
  input: string;
  output: string | null;
  errorCode: string | null;
}

export async function createAiTrace(data: TraceToKeep) {
  await db.aiTrace.create({ data, select: { id: true } });
}

/** At most this many rows per prune: it runs inside someone's request. */
const PRUNE_BATCH = 500;

/**
 * Delete the oldest traces past retention, a bounded batch at a time — a
 * backlog drains over several prunes instead of stalling one request.
 * Returns how many went.
 */
export async function pruneAiTraces(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - AI_TRACE_RETENTION_DAYS * 86_400_000);
  const stale = await db.aiTrace.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    take: PRUNE_BATCH,
    select: { id: true },
  });
  if (stale.length === 0) return 0;
  const { count } = await db.aiTrace.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  return count;
}

/** The traces of these ledger rows — super-admin only, platform-wide. */
export function findTracesByUsage(aiUsageIds: string[]) {
  if (aiUsageIds.length === 0) return Promise.resolve([]);
  return db.aiTrace.findMany({
    where: { aiUsageId: { in: aiUsageIds } },
    select: { aiUsageId: true, input: true, output: true, errorCode: true },
  });
}
