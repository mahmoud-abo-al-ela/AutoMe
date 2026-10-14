import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { z } from "zod";
import { backfillQuestionEmbeddings } from "@/lib/services/buyer-question/meaning";
import { logError } from "@/lib/utils/errors";
import { runAllPages } from "@/lib/utils/paged-run";

/**
 * Give buyer questions their meaning (a vector) where they have none from the
 * current embedding model — the questions asked before embeddings existed, or
 * all of them after AI_EMBEDDING_MODEL changes. A batch per call, in one
 * embedding request, oldest id first. Run it until `next` is null:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://<host>/api/cron/backfill-question-embeddings?limit=100"
 *
 * then again with `&after=<next>`. It only stores vectors — it never folds
 * questions together, so nothing a dealer has seen disappears in a backfill.
 * Platform-paid and low priority, in the embedding pool.
 */

export const runtime = "nodejs";
export const maxDuration = 300;
/** Stop starting new pages with this much of maxDuration left. */
const SAFETY_MS = 30_000;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  after: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const refused = refuseCronRequest(request, "the question-embedding backfill");
  if (refused) return refused;

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid limit or cursor" }, { status: 400 });
  }
  const { limit, after } = parsed.data;

  try {
    return NextResponse.json(await backfillQuestionEmbeddings(limit, after));
  } catch (error) {
    logError("Question-embedding backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}

/**
 * The daily run, scheduled in vercel.json at 02:15 UTC (Vercel Cron sends
 * GET): every page from the start until none is left or the run's time is up.
 * It selects only what is still missing, so what one run doesn't reach the
 * next starts with. This is the recovery path for a save whose background
 * job ran without the queue (lib/jobs) and failed its one try.
 */
export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the scheduled question-embedding backfill");
  if (refused) return refused;

  try {
    const { results, finished } = await runAllPages(
      (after) => backfillQuestionEmbeddings(100, after),
      Date.now() + maxDuration * 1000 - SAFETY_MS
    );
    const embedded = results.reduce((sum, page) => sum + page.embedded, 0);
    return NextResponse.json({ embedded, pages: results.length, finished });
  } catch (error) {
    logError("Question-embedding backfill run failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
