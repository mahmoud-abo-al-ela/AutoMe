import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { mcpHealth } from "@/lib/services/mcp/health";
import { reportMcpHealthBreach } from "@/lib/services/mcp/monitoring";
import { logError } from "@/lib/utils/errors";

/**
 * The public MCP endpoint's last 24 hours against the pilot's targets
 * (lib/services/mcp/health.ts). A day below target is logged and sent to
 * Sentry as one error tagged surface: mcp — what the alert rule in
 * docs/mcp-runbook.md fires on. Read-only; running it again only reports again.
 *
 * Scheduled daily in vercel.json. By hand:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/mcp-health
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the MCP health check");
  if (refused) return refused;

  try {
    const health = await mcpHealth();
    if (health.breaches.length > 0) {
      // A warning line, not logError: reportMcpHealthBreach is its one Sentry event.
      console.warn(`MCP below target over ${health.calls} calls`, { breaches: health.breaches });
      await reportMcpHealthBreach(health);
    }
    return NextResponse.json(health);
  } catch (error) {
    logError("MCP health check failed", error);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
