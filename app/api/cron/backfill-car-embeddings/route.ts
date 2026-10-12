import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { z } from "zod";
import { backfillCarEmbeddings } from "@/lib/services/car/embedding";
import { logError } from "@/lib/utils/errors";

/**
 * Give cars their meaning for search (a vector) where they have none from the
 * current embedding model — the cars listed before meaning-based search, or
 * all of them after AI_EMBEDDING_MODEL changes. A batch per call, in one
 * embedding request, oldest id first. Run it until `next` is null:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://auto-me.vercel.app/api/cron/backfill-car-embeddings?limit=100"
 *
 * then again with `&after=<next>`. Platform-paid and low priority, in the
 * embedding pool. Cars saved from now on are embedded by the car-embedding job.
 */

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  after: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const refused = refuseCronRequest(request, "the car-embedding backfill");
  if (refused) return refused;

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid limit or cursor" }, { status: 400 });
  }

  try {
    return NextResponse.json(await backfillCarEmbeddings(parsed.data.limit, parsed.data.after));
  } catch (error) {
    logError("Car-embedding backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
