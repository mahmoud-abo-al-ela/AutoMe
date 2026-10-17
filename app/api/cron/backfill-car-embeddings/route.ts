import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { z } from "zod";
import { backfillCarEmbeddings } from "@/lib/services/car/embedding";
import { logError } from "@/lib/utils/errors";
import { runAllPages } from "@/lib/utils/paged-run";

export const runtime = "nodejs";
export const maxDuration = 300;
/** Stop starting new pages with this much of maxDuration left. */
const SAFETY_MS = 30_000;

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

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the scheduled car-embedding backfill");
  if (refused) return refused;

  try {
    const { results, finished } = await runAllPages(
      (after) => backfillCarEmbeddings(100, after),
      Date.now() + maxDuration * 1000 - SAFETY_MS
    );
    const embedded = results.reduce((sum, page) => sum + page.embedded, 0);
    return NextResponse.json({ embedded, pages: results.length, finished });
  } catch (error) {
    logError("Car-embedding backfill run failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
