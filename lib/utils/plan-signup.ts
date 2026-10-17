export type PlanSignupKind = "free" | "trial" | "paid";

export function planSignupKind(plan: {
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
}): PlanSignupKind {
  if (plan.monthlyPrice <= 0 && plan.yearlyPrice <= 0) return "free";
  return plan.trialDays > 0 ? "trial" : "paid";
}
