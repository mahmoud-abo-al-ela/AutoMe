import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { runWeeklyDigest } from "@/lib/services/digest/weekly-digest";
import { logError } from "@/lib/utils/errors";

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
