import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
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
    logError("CRON_SECRET is not configured; refusing the car-embedding backfill");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
