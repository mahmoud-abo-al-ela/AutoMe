import * as overviewRepo from "@/lib/repositories/super-admin/overview";
import { graceEndsOn } from "@/lib/services/billing/periods";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { OVERVIEW_METRICS, type OverviewMetric, type OverviewPeriod } from "./overview-options";

/**
 * The super-admin overview (canvas: Super admin overview round 2, "3 · Metric
 * explorer"): five platform numbers for a period against the period before,
 * each with its running total day by day; then the plans, the test-drive
 * funnel and the cars as they stand; then what needs an admin. Days follow
 * Cairo's calendar, like everything else AutoMe counts.
 */

/** What a subscription brings in each month, in piasters: a yearly plan counts as a twelfth of its price. */
export function monthlyIncome(subscriptions: { billingPeriod: string; plan: { monthlyPrice: number; yearlyPrice: number } }[]) {
  return subscriptions.reduce(
    (sum, s) => sum + (s.billingPeriod === "YEARLY" ? Math.round(s.plan.yearlyPrice / 12) : s.plan.monthlyPrice),
    0,
  );
}

/**
 * The period ending today, `days` long with today in it, and the same length
 * just before it: Cairo calendar dates, first day first.
 */
export function periodWindows(today: string, days: number) {
  const start = addDays(today, -(days - 1));
  return { current: { start, end: today }, previous: { start: addDays(start, -days), end: addDays(start, -1) } };
}

/**
 * The running total for each of the `days` days from `start`: day i holds
 * everything from the first day up to and including day i. Events outside
 * the days are left out.
 */
export function runningTotals(events: { date: string; value: number }[], start: string, days: number) {
  const perDay = new Array<number>(days).fill(0);
  const index = new Map(Array.from({ length: days }, (_, i) => [addDays(start, i), i]));
  for (const event of events) {
    const i = index.get(event.date);
    if (i !== undefined) perDay[i] += event.value;
  }
  let total = 0;
  return perDay.map((value) => (total += value));
}

const TRIAL_WARNING_DAYS = 7;
const NEW_DEALERSHIP_DAYS = 7;

export async function getPlatformOverview(days: OverviewPeriod, now: Date = new Date()) {
  const today = cairoDate(now);
  const windows = periodWindows(today, days);
  const since = cairoMidnight(windows.previous.start);
  const currentBegins = cairoMidnight(windows.current.start);

  const [
    payments,
    dealershipDates,
    carDates,
    buyerDates,
    driveDates,
    dealerships,
    paying,
    plans,
    subscriptions,
    drives,
    cars,
    pastDue,
    trials,
    noCars,
    sessions,
  ] = await Promise.all([
    overviewRepo.findPaidPayments(since),
    overviewRepo.findDealershipCreationDates(since),
    overviewRepo.findCarCreationDates(since),
    overviewRepo.findBuyerCreationDates(since),
    overviewRepo.findTestDriveCreationDates(since),
    overviewRepo.countDealerships(),
    overviewRepo.findPayingSubscriptions(),
    overviewRepo.countDealershipsByPlanType(),
    overviewRepo.countSubscriptionsByStatus(),
    overviewRepo.countTestDrivesByStatus(currentBegins),
    overviewRepo.countCarsByStatus(),
    overviewRepo.findPastDueSubscriptions(),
    overviewRepo.findTrialsEndingBefore(cairoMidnight(addDays(today, TRIAL_WARNING_DAYS + 1))),
    overviewRepo.findNewDealershipsWithoutCars(cairoMidnight(addDays(today, -NEW_DEALERSHIP_DAYS))),
    overviewRepo.findOpenSupportSessions(),
  ]);

  const count = (rows: { createdAt: Date }[]) => rows.map((row) => ({ date: cairoDate(row.createdAt), value: 1 }));
  const events: Record<OverviewMetric, { date: string; value: number }[]> = {
    revenue: payments.flatMap((p) => (p.paidAt ? [{ date: cairoDate(p.paidAt), value: p.amountCents }] : [])),
    dealerships: count(dealershipDates),
    cars: count(carDates),
    buyers: count(buyerDates),
    testDrives: count(driveDates),
  };
  const metrics = Object.fromEntries(
    OVERVIEW_METRICS.map((metric) => {
      const current = runningTotals(events[metric], windows.current.start, days);
      const previous = runningTotals(events[metric], windows.previous.start, days);
      return [metric, { value: current.at(-1)!, previous: previous.at(-1)!, current, previousSeries: previous }];
    }),
  ) as Record<OverviewMetric, { value: number; previous: number; current: number[]; previousSeries: number[] }>;

  const drivesRequested = Object.values(drives).reduce<number>((sum, n) => sum + (n ?? 0), 0);

  return {
    today,
    days,
    windows,
    metrics,
    plans: {
      byType: plans,
      total: dealerships.total,
      paying: paying.length,
      trialing: subscriptions.TRIALING ?? 0,
      overdue: subscriptions.PAST_DUE ?? 0,
      monthlyIncome: monthlyIncome(paying),
    },
    testDrives: {
      requested: drivesRequested,
      confirmed: (drives.CONFIRMED ?? 0) + (drives.COMPLETED ?? 0),
      completed: drives.COMPLETED ?? 0,
    },
    cars: {
      available: cars.AVAILABLE ?? 0,
      hidden: cars.UNAVAILABLE ?? 0,
      sold: cars.SOLD ?? 0,
      dealerships: dealerships.total,
    },
    needsYou: {
      pastDue: pastDue.map((s) => ({
        organization: s.organization,
        plan: s.plan,
        since: s.pastDueSince?.toISOString() ?? null,
        // The day it drops to the free plan, if nobody pays.
        dropsOn: s.currentPeriodEnd ? graceEndsOn(s.currentPeriodEnd) : null,
      })),
      trialsEnding: trials.map((s) => ({
        organization: s.organization,
        plan: s.plan,
        endsOn: s.currentPeriodEnd ? cairoDate(s.currentPeriodEnd) : null,
      })),
      sessions: sessions.map((s) => ({ ...s, startedAt: s.startedAt.toISOString() })),
      newWithoutCars: noCars,
    },
  };
}

export type PlatformOverview = Awaited<ReturnType<typeof getPlatformOverview>>;
