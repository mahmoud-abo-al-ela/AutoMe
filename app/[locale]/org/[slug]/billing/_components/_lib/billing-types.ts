import type { getBillingData } from "@/lib/services/billing";

/**
 * Every shape on the billing page comes from one service call, so the types are
 * derived from it rather than restated. Changing what getBillingData selects
 * then surfaces here instead of drifting silently.
 *
 * `import type` is erased at compile time, so pulling the server module in for
 * its types does not drag it into the client bundle.
 */
type BillingData = Awaited<ReturnType<typeof getBillingData>>;

/** The active subscription with its plan, or null when the org has none. */
export type BillingSubscription = BillingData["subscription"];

/** Current usage counts, used against the plan limits. */
export type BillingUsage = BillingData["usage"];

/** One selectable plan. */
export type BillingPlan = BillingData["plans"][number];
