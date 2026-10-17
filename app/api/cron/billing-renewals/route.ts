import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { runBillingRenewals } from "@/lib/services/billing/renewals";
import { logError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const maxDuration = 300;
/** Stop starting new work with this much of maxDuration left. */
const SAFETY_MS = 30_000;

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the billing renewals");
  if (refused) return refused;

  try {
    const report = await runBillingRenewals(new Date(), {
      deadline: Date.now() + maxDuration * 1000 - SAFETY_MS,
    });
    return NextResponse.json(report);
  } catch (error) {
    logError("Billing renewals run failed", error);
    return NextResponse.json({ error: "Billing renewals failed" }, { status: 500 });
  }
}
