import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { z } from "zod";
import { backfillImageAlts } from "@/lib/services/car/image-alts-backfill";
import { logError } from "@/lib/utils/errors";

/**
 * Describe the photos of cars listed before photo descriptions existed.
 *
 * New and edited cars are described on save; this catches up the rest, a
 * batch per call, oldest id first. Run it until `remaining` is 0:
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://<host>/api/cron/backfill-image-alts?limit=10"
 *
 * then again with `&after=<next>` from each reply. The cursor is what moves
 * the backfill past a car whose photos cannot be described (a dead image
 * URL) instead of retrying it forever.
 *
 * Platform-paid, like the descriptions written on save: metered as
 * carImageAltText, which no plan allowance counts, at low priority so it
 * never takes capacity a dealer is waiting on.
 */

export const runtime = "nodejs";
/** One vision call per car; ten cars fit well inside it. Needs Fluid compute. */
export const maxDuration = 300;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  after: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const refused = refuseCronRequest(request, "the alt-text backfill");
  if (refused) return refused;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid limit or cursor" }, { status: 400 });
  }
  const { limit, after } = parsed.data;

  try {
    return NextResponse.json(await backfillImageAlts(limit, after));
  } catch (error) {
    logError("Alt-text backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
