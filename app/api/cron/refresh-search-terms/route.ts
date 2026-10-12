import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
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

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the search vocabulary refresh");
  if (refused) return refused;

  try {
    await refreshSearchVocabulary();
    return NextResponse.json({ refreshed: true });
  } catch (error) {
    logError("Search vocabulary refresh failed", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
