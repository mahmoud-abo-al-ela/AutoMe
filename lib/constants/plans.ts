const PLAN_KEY_BY_TYPE = {
  STARTER: "starter",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type PlanKey = (typeof PLAN_KEY_BY_TYPE)[keyof typeof PLAN_KEY_BY_TYPE];

/** Message key under `plans.plans` for a DB plan `type`, or null if unrecognised. */
export function planKeyFor(type?: string | null): PlanKey | null {
  if (!type) return null;
  return PLAN_KEY_BY_TYPE[type as keyof typeof PLAN_KEY_BY_TYPE] ?? null;
}
