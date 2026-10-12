import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { runWeeklyDigest } from "@/lib/services/digest/weekly-digest";
import { logError } from "@/lib/utils/errors";

/**
 * Send last week's summary email to every dealership's owners.
 *
 * Scheduled in vercel.json for Saturday 06:00–09:00 UTC, hourly: 09:00 Cairo
 * is 06:00 or 07:00 UTC depending on daylight saving time, the service only
 * sends from 09:00 Cairo, and the later runs finish anything an earlier one
 * ran out of time for. Running again — or being retried — is safe: each
 * dealership's week is claimed once in the DigestSend ledger. To run it by
 * hand, or to finish a run that stopped at its time limit:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/weekly-digest
 *
 * Vercel Cron sends GET with `Authorization: Bearer $CRON_SECRET`.
 */

export const runtime = "nodejs";
/** One model call and a few emails per dealership. Needs Fluid compute for 300. */
export const maxDuration = 300;
/** Stop starting new dealerships with this much of maxDuration left. */
const SAFETY_MS = 30_000;

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the weekly summary");
  if (refused) return refused;

  try {
    const report = await runWeeklyDigest(new Date(), {
      deadline: Date.now() + maxDuration * 1000 - SAFETY_MS,
    });
    return NextResponse.json(report);
  } catch (error) {
    logError("Weekly summary run failed", error);
    return NextResponse.json({ error: "Weekly summary failed" }, { status: 500 });
  }
}
