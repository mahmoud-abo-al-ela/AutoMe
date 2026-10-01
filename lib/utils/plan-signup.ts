/**
 * How a plan starts for a new dealership. Shared by the onboarding form
 * (which path to take) and the server (which path to allow), so the two
 * cannot disagree.
 *
 *   free  — no price: created at once, nothing to pay, ever;
 *   trial — a paid plan with trial days: created at once, paid at the trial's end;
 *   paid  — paid at a Paymob checkout before the dealership exists.
 */
export type PlanSignupKind = "free" | "trial" | "paid";

export function planSignupKind(plan: {
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
}): PlanSignupKind {
  if (plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0) return "free";
  return plan.trialDays > 0 ? "trial" : "paid";
}
