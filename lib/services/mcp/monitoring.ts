import { sentryEnabled } from "@/lib/sentry-enabled";
import type { McpHealth } from "./health";

/**
 * What reaches Sentry from the public MCP endpoint, tagged `surface: mcp` so
 * one alert rule can watch all of it (docs/mcp-runbook.md).
 *
 * The record of every call is McpToolCall — rates and latency come from
 * there (./health.ts). Sentry gets only what someone must look at: a failure
 * that is AutoMe's fault ("internal"), a dependency down ("unavailable"), and
 * a day whose rates crossed the pilot's targets. Never the caller's input:
 * the tool, the code and the error are enough, and arguments are what the
 * telemetry promised not to keep.
 *
 * The SDK is imported lazily and only on these paths, as in lib/ai/telemetry.ts;
 * nothing here may throw into the request it reports on.
 */

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
