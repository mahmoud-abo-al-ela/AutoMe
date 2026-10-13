import * as aiUsageRepository from "@/lib/repositories/ai-usage";

/**
 * AI usage as an operator reads it, platform-wide: per feature, per model,
 * per error code, and the latest failed calls. Aggregates and call metadata
 * only — no organization or user is named, so no tenant can be singled out.
 */

/** How far back, and how much, an ops read may go. */
export const OPS_LIMITS = {
  maxDays: 31,
  maxErrors: 100,
  maxTraces: 50,
  /** Per text field in a trace list; one trace read in full is capped by redactText. */
  traceListFieldChars: 2_048,
} as const;

const DAY_MS = 86_400_000;

function windowSince(days: number, now: number): Date {
  const bounded = Math.min(Math.max(Math.trunc(days), 1), OPS_LIMITS.maxDays);
  return new Date(now - bounded * DAY_MS);
}

export async function aiUsageSummary(days: number, now = Date.now()) {
  const since = windowSince(days, now);
  const [byFeature, byModel] = await Promise.all([
    aiUsageRepository.getUsageByFeature(since),
    aiUsageRepository.getUsageByModel(since),
  ]);
  const totals = byFeature.reduce(
    (sum, row) => ({
      calls: sum.calls + row.calls,
      failures: sum.failures + row.failures,
      inputTokens: sum.inputTokens + row.inputTokens,
      outputTokens: sum.outputTokens + row.outputTokens,
      thinkingTokens: sum.thinkingTokens + row.thinkingTokens,
      costMicroUsd: sum.costMicroUsd + row.costMicroUsd,
    }),
    { calls: 0, failures: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0, costMicroUsd: 0 }
  );
  return { since: since.toISOString(), totals, byFeature, byModel };
}

export async function recentAiErrors(days: number, limit: number, now = Date.now()) {
  const since = windowSince(days, now);
  const bounded = Math.min(Math.max(Math.trunc(limit), 1), OPS_LIMITS.maxErrors);
  const [byCode, recent] = await Promise.all([
    aiUsageRepository.getFailuresByCode(since),
    aiUsageRepository.findRecentFailures(since, bounded),
  ]);
  return {
    since: since.toISOString(),
    byCode,
    recent: recent.map((failure) => ({ ...failure, createdAt: failure.createdAt.toISOString() })),
  };
}
