import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { runBillingRenewals } from "@/lib/services/billing/renewals";
import { logError } from "@/lib/utils/errors";

/**
 * The daily billing job: renewal reminders, past due, the drop to the free
 * plan, moving onto renewals paid ahead, and catching up on payments Paymob's
 * callback never reported (lib/services/billing/renewals.ts).
 *
 * Scheduled in vercel.json at 05:00 UTC: 07:00 Cairo in winter, 08:00 in
 * summer. Running again, or being retried, is safe: every step acts only on
 * the state it finds and every email is claimed once per period. To run it by
 * hand, or to finish a run that stopped at its time limit:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/billing-renewals
 *
 * Vercel Cron sends GET with `Authorization: Bearer $CRON_SECRET`.
 */

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
