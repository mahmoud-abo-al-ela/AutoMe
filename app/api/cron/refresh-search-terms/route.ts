import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { refreshSearchVocabulary } from "@/lib/services/car/search-vocabulary";
import { logError } from "@/lib/utils/errors";

/**
 * The daily refresh of the search's vocabulary — the words typo correction
 * proposes from. Changes queue their own refresh (lib/jobs/search-terms.ts);
 * this catches up whatever one of those missed, after every retry failed.
 *
 * Scheduled in vercel.json. Running again is safe: a refresh recomputes
 * everything and never blocks searches. To run it by hand:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/refresh-search-terms
 *
 * Vercel Cron sends GET with `Authorization: Bearer $CRON_SECRET`.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

/** Constant-time: this endpoint is public and can be hammered. */
function secretMatches(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  // Fail closed: no secret configured means nobody may run this.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logError("CRON_SECRET is not configured; refusing the search vocabulary refresh");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await refreshSearchVocabulary();
    return NextResponse.json({ refreshed: true });
  } catch (error) {
    logError("Search vocabulary refresh failed", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
