import * as plansRepo from "@/lib/repositories/super-admin/plans-page";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { monthlyIncome } from "./overview";

/**
 * The super-admin plans page (canvas: Super admin plans round 1, "1 ·
 * Comparison table"): every plan with what it costs and includes, and who is
 * on it — paying, on a trial, overdue — with what each brings in a month.
 */

const TRIAL_WARNING_DAYS = 7;

/** A plan's monthly price, or a twelfth of its yearly one, for a subscription. */
const perMonth = (sub: { billingPeriod: string; plan: { monthlyPrice: number; yearlyPrice: number } }) => monthlyIncome([sub]);

export async function getPlansPage(now: Date = new Date()) {
  const trialsEndBy = cairoMidnight(addDays(cairoDate(now), TRIAL_WARNING_DAYS + 1));
  const [plans, subscriptions, withoutSubscription] = await Promise.all([
    plansRepo.findPlans(),
    plansRepo.findLiveSubscriptions(),
    plansRepo.countDealershipsWithoutSubscription(),
  ]);

  const byPlan = new Map<string, { paying: number; trialing: number; overdue: number; total: number; income: number }>();
  for (const plan of plans) byPlan.set(plan.id, { paying: 0, trialing: 0, overdue: 0, total: 0, income: 0 });
  let trialsEndingSoon = 0;
  let atRisk = 0;
  for (const sub of subscriptions) {
    const tally = byPlan.get(sub.planId);
    if (!tally) continue;
    tally.total += 1;
    const free = sub.plan.monthlyPrice === 0 && sub.plan.yearlyPrice === 0;
    if (sub.status === "ACTIVE") {
      if (!free) tally.paying += 1;
      tally.income += perMonth(sub);
    } else if (sub.status === "TRIALING") {
      tally.trialing += 1;
      if (sub.currentPeriodEnd && sub.currentPeriodEnd < trialsEndBy) trialsEndingSoon += 1;
    } else {
      tally.overdue += 1;
      atRisk += perMonth(sub);
    }
  }
  const starter = plans.find((plan) => plan.type === "STARTER");
  if (starter && withoutSubscription) byPlan.get(starter.id)!.total += withoutSubscription;

  const rows = plans.map((plan) => ({ ...plan, updatedAt: plan.updatedAt.toISOString(), dealerships: byPlan.get(plan.id)! }));
  return {
    plans: rows,
    totals: {
      income: rows.reduce((sum, plan) => sum + plan.dealerships.income, 0),
      paying: rows.reduce((sum, plan) => sum + plan.dealerships.paying, 0),
      dealerships: rows.reduce((sum, plan) => sum + plan.dealerships.total, 0),
      trialing: rows.reduce((sum, plan) => sum + plan.dealerships.trialing, 0),
      trialsEndingSoon,
      overdue: rows.reduce((sum, plan) => sum + plan.dealerships.overdue, 0),
      atRisk,
    },
  };
}

export type PlansPage = Awaited<ReturnType<typeof getPlansPage>>;
export type PlanRow = PlansPage["plans"][number];
