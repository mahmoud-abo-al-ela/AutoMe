/**
 * Message keys for the subscription plans, keyed off the DB plan `type`.
 *
 * Lives in lib/ because both sides need it: pricing cards, billing and admin
 * screens translate a plan's name with it, and so does the billing email the
 * server renders (lib/services/notification). The pricing card model itself —
 * icons, default plans — stays in components/Pricing/pricing-plans.ts.
 */
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
