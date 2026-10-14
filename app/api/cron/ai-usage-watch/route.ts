import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { watchAiUsage } from "@/lib/services/ai/usage-watch";
import { logError } from "@/lib/utils/errors";

/**
 * The last 24 hours of AI calls per dealership against AI_DAILY_CALLS_ALERT
 * (lib/services/ai/usage-watch.ts); each one over it is a Sentry warning
 * tagged signal: ai.usage-spike (docs/observability-runbook.md). Read-only.
 *
 * Scheduled daily in vercel.json. By hand:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/ai-usage-watch
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the AI usage watch");
  if (refused) return refused;

  try {
    return NextResponse.json(await watchAiUsage());
  } catch (error) {
    logError("AI usage watch failed", error);
    return NextResponse.json({ error: "Usage watch failed" }, { status: 500 });
  }
}
