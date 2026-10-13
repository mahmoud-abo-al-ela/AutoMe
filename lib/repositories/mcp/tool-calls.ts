// MCP tool-call repository - the pilot's measures (McpToolCall)
import { db } from "@/lib/prisma";

/** Calls older than this are pruned: pilot measures, not an archive. */
export const MCP_TOOL_CALL_RETENTION_DAYS = 30;

export interface McpToolCallToKeep {
  tool: string;
  durationMs: number;
  resultCount: number | null;
  errorCode: string | null;
  clientFamily: string | null;
  ipHash: string | null;
}

export async function createMcpToolCall(data: McpToolCallToKeep) {
  await db.mcpToolCall.create({ data, select: { id: true } });
}

/** At most this many rows per prune: it runs inside someone's request. */
const PRUNE_BATCH = 500;

/** Delete the oldest calls past retention, a bounded batch at a time. Returns how many went. */
export async function pruneMcpToolCalls(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - MCP_TOOL_CALL_RETENTION_DAYS * 86_400_000);
  const stale = await db.mcpToolCall.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    take: PRUNE_BATCH,
    select: { id: true },
  });
  if (stale.length === 0) return 0;
  const { count } = await db.mcpToolCall.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  return count;
}
