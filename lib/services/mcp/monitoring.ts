import { sentryEnabled } from "@/lib/sentry-enabled";
import type { McpHealth } from "./health";

export type McpFailureCode = "internal" | "unavailable";

export async function reportMcpFailure(failure: { tool: string; code: McpFailureCode; error: unknown }): Promise<void> {
  if (!sentryEnabled) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      scope.setTag("surface", "mcp");
      scope.setTag("mcp.tool", failure.tool);
      scope.setTag("mcp.error_code", failure.code);
      scope.setLevel(failure.code === "internal" ? "error" : "warning");
      // One issue per tool and code, not one per distinct message.
      scope.setFingerprint(["mcp", failure.tool, failure.code]);
      Sentry.captureException(failure.error instanceof Error ? failure.error : new Error(`MCP ${failure.tool} ${failure.code}`));
    });
  } catch {
    // Monitoring must never be the reason a call fails; the McpToolCall row is the record.
  }
}

/** A day below the pilot's targets (./health.ts), as one Sentry error to alert on. */
export async function reportMcpHealthBreach(health: McpHealth): Promise<void> {
  if (!sentryEnabled || health.breaches.length === 0) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      scope.setTag("surface", "mcp");
      scope.setTag("mcp.check", "daily-health");
      scope.setLevel("error");
      scope.setFingerprint(["mcp", "daily-health"]);
      scope.setContext("mcp_health", {
        window: health.window,
        calls: health.calls,
        breaches: health.breaches,
      });
      Sentry.captureMessage(
        `MCP below target: ${health.breaches.map((breach) => `${breach.metric} ${breach.value} (limit ${breach.limit})`).join("; ")}`
      );
    });
  } catch {
    // The cron's own response and log line still carry the breach.
  }
}
