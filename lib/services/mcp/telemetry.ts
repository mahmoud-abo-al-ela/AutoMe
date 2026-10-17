import { createHmac } from "node:crypto";
import { createMcpToolCall, pruneMcpToolCalls } from "@/lib/repositories/mcp/tool-calls";
import { logError } from "@/lib/utils/errors";

export interface ToolCallRecord {
  tool: string;
  durationMs: number;
  resultCount?: number | null;
  errorCode?: string | null;
  /** The raw User-Agent; only its clientFamily is kept. */
  userAgent?: string | null;
  ip?: string | null;
}

/** Prune about one write in this many — retention without a cron. */
const PRUNE_ONE_IN = 50;

// Salted and rotated daily so callers can be counted but never identified or followed across days.
export function dailyIpHash(ip: string | null | undefined, now: Date = new Date()): string | null {
  const secret = process.env.MCP_IP_HASH_SECRET;
  if (!ip || !secret) return null;
  const day = now.toISOString().slice(0, 10);
  return createHmac("sha256", `${secret}:${day}`).update(ip).digest("hex").slice(0, 16);
}

/**
 * The client's name for itself from its User-Agent, reduced to a short token
 * ("claude-user", "node"): which clients use the server, nothing about who.
 */
export function clientFamily(userAgent: string | null | undefined): string | null {
  const first = (userAgent ?? "").trim().split(/[\s/;(]/)[0] ?? "";
  const token = first.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 40);
  return token || null;
}

/**
 * Keep a call's measures. Best effort, on purpose: a lost measure must never
 * fail the buyer's answer, so a write failure is logged and swallowed.
 */
export async function recordToolCall(call: ToolCallRecord): Promise<void> {
  try {
    await createMcpToolCall({
      tool: call.tool,
      durationMs: Math.max(0, Math.round(call.durationMs)),
      resultCount: call.resultCount ?? null,
      errorCode: call.errorCode ?? null,
      clientFamily: clientFamily(call.userAgent),
      ipHash: dailyIpHash(call.ip),
    });
    if (Math.random() * PRUNE_ONE_IN < 1) await pruneMcpToolCalls();
  } catch (error) {
    logError("Recording an MCP tool call failed; answered without it", error);
  }
}
