import type { Locale } from "@/i18n/routing";
import { generateStructured, type AiCallerContext } from "@/lib/ai/client";
import { AI_FEATURES } from "@/lib/ai/features";
import { weeklySummaryPrompt } from "@/lib/ai/prompts/weekly-summary";
import { weeklySummarySchema, type WeeklySummary } from "@/lib/ai/schemas/weekly-summary";
import { textPart } from "@/lib/ai/provider/types";

/**
 * The words at the top of a dealership's weekly summary, written around its
 * figures (`numbers`, as JSON). Nobody waits on it — a cron sends the email —
 * but it runs once per dealership in one invocation, so it takes the fast
 * chain to keep the whole run inside its time limit.
 */
export async function writeWeeklySummary(
  numbers: Record<string, number | null>,
  locale: Locale,
  ctx: AiCallerContext
): Promise<WeeklySummary> {
  const json = JSON.stringify(numbers);
  return generateStructured({
    feature: AI_FEATURES.weeklyDigest,
    task: "text",
    parts: [textPart(weeklySummaryPrompt.text(locale)), textPart(json)],
    schema: weeklySummarySchema,
    promptVersion: `${weeklySummaryPrompt.version}.${locale}`,
    ctx,
    cacheBytes: json,
    thinking: "low",
    temperature: 0.3,
    // CodeCraft answers whole, not streamed; the per-attempt timeout decides.
    firstTokenTimeoutMs: 20_000,
  });
}
