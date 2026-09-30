import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as carRepository from "@/lib/repositories/car";
import { refreshImageAlts } from "@/lib/services/car/image-alts";
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
    logError("CRON_SECRET is not configured; refusing the alt-text backfill");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid limit or cursor" }, { status: 400 });
  }
  const { limit, after } = parsed.data;

  try {
    const cars = await carRepository.findCarsMissingImageAlts({ take: limit, afterId: after });
    for (const car of cars) {
      // Scoped to the car's own dealership inside; never throws.
      await refreshImageAlts(car.id, car.organizationId, {
        organizationId: car.organizationId,
        userId: null,
        priority: "low",
      });
    }
    const next = cars.at(-1)?.id ?? null;
    const remaining = next ? await carRepository.countCarsMissingImageAlts(next) : 0;
    return NextResponse.json({ processed: cars.length, next, remaining });
  } catch (error) {
    logError("Alt-text backfill failed", error);
    return NextResponse.json({ error: "Backfill failed" }, { status: 500 });
  }
}
