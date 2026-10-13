// MCP referral repository - visits that came from an MCP answer's link (McpReferral)
import { db } from "@/lib/prisma";

/** Visits older than this are pruned: pilot measures, not an archive. */
export const MCP_REFERRAL_RETENTION_DAYS = 30;

export interface McpReferralToKeep {
  kind: "car" | "dealership";
  target: string;
  medium: string;
}

export async function createMcpReferral(data: McpReferralToKeep) {
  await db.mcpReferral.create({ data, select: { id: true } });
}

/** At most this many rows per prune: it runs after someone's page. */
const PRUNE_BATCH = 500;

/** Delete the oldest visits past retention, a bounded batch at a time. Returns how many went. */
export async function pruneMcpReferrals(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - MCP_REFERRAL_RETENTION_DAYS * 86_400_000);
  const stale = await db.mcpReferral.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    take: PRUNE_BATCH,
    select: { id: true },
  });
  if (stale.length === 0) return 0;
  const { count } = await db.mcpReferral.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  return count;
}
