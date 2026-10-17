import type { getBillingData } from "@/lib/services/billing";

type BillingData = Awaited<ReturnType<typeof getBillingData>>;

/** The active subscription with its plan, or null when the org has none. */
export type BillingSubscription = BillingData["subscription"];

/** Current usage counts, used against the plan limits. */
export type BillingUsage = BillingData["usage"];

/** One selectable plan. */
export type BillingPlan = BillingData["plans"][number];

/** Where the renewal stands now; null on the free plan. */
export type BillingRenewal = BillingData["renewal"];

/** The next period, when it is already paid for. */
export type BillingPaidAhead = BillingData["paidAhead"];

/** One row of the payment history. */
export type BillingPayment = BillingData["payments"][number];
