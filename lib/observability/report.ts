import { sentryEnabled } from "@/lib/sentry-enabled";

/**
 * What AutoMe tells Sentry beyond crashes, and how it is grouped so that one
 * alert rule can watch each kind (docs/observability-runbook.md).
 *
 * Two entry points:
 * - reportUnexpected: an error someone caught and logged (logError) that was
 *   not an expected, typed one. Before this, those stopped at the console —
 *   a Server Action wrapped in withErrorHandling, a route handler's catch, a
 *   failed background job never reached Sentry at all.
 * - reportSignal: a named event worth an alert even though nothing crashed —
 *   access refused, a support session, a subscription falling behind.
 *
 * Tags carry ids and codes only, never what a person wrote. The SDK is
 * imported lazily and only on these paths (as in lib/ai/telemetry.ts), and
 * nothing here may throw into the request it reports on.
 */

export type SignalName =
  | "authz.refused"
  | "support-session.started"
  | "support-session.ended"
  | "billing.past-due"
  | "billing.downgraded"
  | "billing.payment-rejected"
  | "job.failed"
  | "ai.usage-spike";

type Level = "info" | "warning" | "error";

/** Errors already sent with their own tags (reportSignal), so logError does not send them again. */
const reported = new WeakSet<object>();

/**
 * One issue per kind of failure, not one per id or count in its message:
 * "Background job image-alts failed" stays one issue across every car.
 */
export function groupingKey(text: string): string {
  return text
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    // Prefixed ids (Clerk's user_2Nx…): a digit in the tail, so a snake_case word is left alone.
    .replace(/\b[a-z]+_(?=[a-z0-9]*\d)[a-z0-9]{8,}\b/gi, "<id>")
    .replace(/\d+/g, "<n>");
}

export async function reportSignal(signal: {
  name: SignalName;
  level: Level;
  /** Ids and codes to filter and alert on. */
  tags?: Record<string, string>;
  /** Splits the signal into separate issues, e.g. by job name. */
  groupBy?: string;
  /** Extra detail on the event, not indexed. */
  context?: Record<string, unknown>;
  /** The failure itself, when there is one: its stack is the point. */
  error?: unknown;
}): Promise<void> {
  if (signal.error && typeof signal.error === "object") reported.add(signal.error);
  if (!sentryEnabled) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      scope.setTag("signal", signal.name);
      for (const [key, value] of Object.entries(signal.tags ?? {})) scope.setTag(key, value);
      scope.setLevel(signal.level);
      scope.setFingerprint(["signal", signal.name, ...(signal.groupBy ? [signal.groupBy] : [])]);
      if (signal.context) scope.setContext("signal", signal.context);
      if (signal.error instanceof Error) Sentry.captureException(signal.error);
      else Sentry.captureMessage(signal.groupBy ? `${signal.name}: ${signal.groupBy}` : signal.name);
    });
  } catch {
    // Monitoring must never be the reason a request fails; the log line is still there.
  }
}

export async function reportUnexpected(error: Error, context?: string): Promise<void> {
  if (!sentryEnabled || reported.has(error)) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      scope.setTag("signal", "unexpected");
      scope.setLevel("error");
      scope.setFingerprint(["unexpected", groupingKey(context ?? error.message)]);
      if (context) scope.setContext("logged", { context });
      Sentry.captureException(error);
    });
  } catch {
    // As above: the console line logError wrote is the fallback record.
  }
}
