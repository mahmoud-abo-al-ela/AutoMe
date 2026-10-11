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

/** Delete traces past retention. Returns how many went. */
export async function pruneAiTraces(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - AI_TRACE_RETENTION_DAYS * 86_400_000);
  const { count } = await db.aiTrace.deleteMany({ where: { createdAt: { lt: cutoff } } });
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
