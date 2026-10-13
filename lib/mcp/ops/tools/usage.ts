import { z } from "zod";
import { OPS_LIMITS, aiUsageSummary, recentAiErrors } from "@/lib/services/ai-ops";
import type { OpsTool } from "../tool";

const days = z
  .number()
  .int()
  .min(1)
  .max(OPS_LIMITS.maxDays)
  .default(7)
  .describe(`How many days back, 1–${OPS_LIMITS.maxDays}.`);

const tokens = { inputTokens: z.number(), outputTokens: z.number(), thinkingTokens: z.number() };

export const usageSummaryTool: OpsTool<{ days: typeof days }, Record<string, z.ZodTypeAny>> = {
  name: "get_ai_usage_summary",
  title: "AI usage summary",
  description:
    "Platform-wide AI calls, failures, tokens and cost for the last N days, per feature and per model " +
    "(with p50/p95 latency). Aggregates only: no organization or user is named.",
  inputSchema: { days },
  outputSchema: {
    since: z.string(),
    totals: z.object({ calls: z.number(), failures: z.number(), costMicroUsd: z.number(), ...tokens }),
    byFeature: z.array(
      z.object({ feature: z.string(), calls: z.number(), failures: z.number(), cachedTokens: z.number(), costMicroUsd: z.number(), ...tokens })
    ),
    byModel: z.array(
      z.object({
        model: z.string(),
        calls: z.number(),
        failures: z.number(),
        p50LatencyMs: z.number(),
        p95LatencyMs: z.number(),
        cachedTokens: z.number(),
        ...tokens,
      })
    ),
  },
  run: ({ days }) => aiUsageSummary(days),
};

const limit = z
  .number()
  .int()
  .min(1)
  .max(OPS_LIMITS.maxErrors)
  .default(20)
  .describe(`How many of the latest failed calls to list, 1–${OPS_LIMITS.maxErrors}.`);

export const recentErrorsTool: OpsTool<{ days: typeof days; limit: typeof limit }, Record<string, z.ZodTypeAny>> = {
  name: "get_recent_ai_errors",
  title: "Recent AI errors",
  description:
    "Failed AI calls over the last N days: counts per error code (HTTP_503, TIMEOUT, SCHEMA_REJECTED…) " +
    "and the latest failures with feature, model and latency. No organization or user is named.",
  inputSchema: { days, limit },
  outputSchema: {
    since: z.string(),
    byCode: z.array(z.object({ errorCode: z.string(), count: z.number() })),
    recent: z.array(
      z.object({
        id: z.string(),
        createdAt: z.string(),
        feature: z.string(),
        provider: z.string(),
        model: z.string(),
        errorCode: z.string().nullable(),
        latencyMs: z.number(),
      })
    ),
  },
  run: ({ days, limit }) => recentAiErrors(days, limit),
};
