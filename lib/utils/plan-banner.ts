/**
 * Which upgrade banner, if any, a plan-gated resource should show.
 *
 * Pulled out of the component because the interesting part is a set of
 * numeric edge cases, and one of them shipped wrong: `current >= limit` is
 * true at `0 >= 0`, so a brand-new org on a plan that does not carry a
 * feature at all was told it had exhausted an allowance it never had.
 */
export type UpgradeBannerState =
  | "hidden"
  | "noPlan"
  | "notIncluded"
  | "atLimit"
  | "nearLimit";

/** The share of the limit at which the warning banner appears. */
const NEAR_LIMIT_RATIO = 0.8;

export function upgradeBannerState({
  current,
  limit,
  planType,
}: {
  current: number;
  /** -1 means unlimited. 0 means the plan does not carry the feature. */
  limit: number;
  /** "NONE" is what getPlanGateStatus reports for an org with no subscription. */
  planType: string;
}): UpgradeBannerState {
  if (limit === -1) return "hidden";
  if (planType === "NONE") return "noPlan";
  if (limit <= 0) return "notIncluded";
  if (current >= limit) return "atLimit";
  if (current >= limit * NEAR_LIMIT_RATIO) return "nearLimit";
  return "hidden";
}
