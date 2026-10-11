import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { embedTexts, embeddingModel } from "@/lib/ai/embeddings";
import { AI_FEATURES } from "@/lib/ai/features";
import * as buyerQuestionRepository from "@/lib/repositories/buyer-question";
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

/** Constant-time: this endpoint is public and can be hammered. */
function secretMatches(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  // Fail closed: no secret configured means nobody may run this.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logError("CRON_SECRET is not configured; refusing the question-embedding backfill");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid limit or cursor" }, { status: 400 });
  }
  const { limit, after } = parsed.data;

  try {
    const questions = await buyerQuestionRepository.findQuestionsMissingEmbedding(embeddingModel(), limit, after);
    if (questions.length === 0) return NextResponse.json({ embedded: 0, next: null });

    const { model, vectors } = await embedTexts({
      feature: AI_FEATURES.questionEmbedding,
      texts: questions.map((q) => q.question),
      task: "similarity",
      ctx: { organizationId: null, userId: null, priority: "low" },
    });
    for (const [i, question] of questions.entries()) {
      // Scoped to the question's own dealership in the WHERE.
      await buyerQuestionRepository.setQuestionEmbedding({
        id: question.id,
        organizationId: question.organizationId,
        vector: vectors[i],
        model,
      });
    }
    const next = questions.length === limit ? questions.at(-1)!.id : null;
    return NextResponse.json({ embedded: questions.length, next });
  } catch (error) {
    logError("Question-embedding backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
