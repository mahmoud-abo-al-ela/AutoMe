import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { z } from "zod";
import { backfillQuestionEmbeddings } from "@/lib/services/buyer-question/meaning";
import { logError } from "@/lib/utils/errors";

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
