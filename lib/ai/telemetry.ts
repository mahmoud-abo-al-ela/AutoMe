import { sentryEnabled } from "@/lib/sentry-enabled";

/**
 * Breadcrumbs for AI failures.
 *
 * The primary record is the `AiUsage` row, not this: it is durable,
 * aggregatable, and the super-admin usage panel reads it. Rates, latency tails
 * and error-code breakdowns all belong there and are answered better by a
 * query than by a log search.
 *
 * What the ledger cannot do is attach to a specific user's reported error.
 * Server-side AI failures previously reached `console` and nothing else —
 * Sentry is only captured in the client error boundaries — so a dealer saying
 * "it failed for me an hour ago" had no trail beyond an aggregate count. These
 * breadcrumbs sit on the request so the next captured exception carries the
 * provider history that led to it.
 *
 * Imported lazily and only on a failure path. Sentry is deliberately disabled
 * in development because loading the SDK is the largest cost at dev boot, and
 * failures are rare enough that the import is never on a hot path.
 *
 * **Never pass prompts or image bytes here.** Breadcrumbs are attached to
 * events that leave the building; the feature name, the model and an error
 * code are enough to debug with, and none of them is user content.
 */
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
