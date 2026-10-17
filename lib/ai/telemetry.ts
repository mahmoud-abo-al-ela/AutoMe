import { sentryEnabled } from "@/lib/sentry-enabled";

export interface AiFailureBreadcrumb {
  feature: string;
  model: string;
  errorCode: string;
  latencyMs: number;
  attempt: number;
}

export async function recordAiFailure(
  crumb: AiFailureBreadcrumb
): Promise<void> {
  if (!sentryEnabled) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.addBreadcrumb({
      category: "ai",
      level: "warning",
      message: `${crumb.feature} failed on ${crumb.model}`,
      data: {
        feature: crumb.feature,
        model: crumb.model,
        errorCode: crumb.errorCode,
        latencyMs: crumb.latencyMs,
        attempt: crumb.attempt,
      },
    });
  } catch {
    // Telemetry must never be the reason a request fails. The ledger row has
    // already been written by this point regardless.
  }
}
