import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { mcpHealth } from "@/lib/services/mcp/health";
import { reportMcpHealthBreach } from "@/lib/services/mcp/monitoring";
import { logError } from "@/lib/utils/errors";

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
