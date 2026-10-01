import { describe, it, expect } from "vitest";
import { planChange, type CurrentSubscription } from "@/lib/utils/plan-change";

const starter = { id: "starter", monthlyPrice: 0, yearlyPrice: 0 };
const pro = { id: "pro", monthlyPrice: 150_000, yearlyPrice: 1_500_000 };
const enterprise = { id: "ent", monthlyPrice: 500_000, yearlyPrice: 5_000_000 };

const on = (
  plan: typeof pro,
  status = "ACTIVE",
  billingPeriod: "MONTHLY" | "YEARLY" = "MONTHLY"
): CurrentSubscription => ({ planId: plan.id, plan, status, billingPeriod });

describe("planChange", () => {
  it("buys any paid plan now from the free plan, or with no subscription", () => {
    expect(planChange(on(starter), pro, "MONTHLY")).toBe("pay");
    expect(planChange(null, pro, "YEARLY")).toBe("pay");
    expect(planChange(on(starter), starter, "MONTHLY")).toBe("none");
  });

  it("pays now for an upgrade and schedules a downgrade", () => {
    expect(planChange(on(pro), enterprise, "MONTHLY")).toBe("pay");
    expect(planChange(on(enterprise), pro, "MONTHLY")).toBe("schedule");
    expect(planChange(on(pro), starter, "MONTHLY")).toBe("schedule");
  });

  it("schedules a switch between monthly and yearly for the period end", () => {
    expect(planChange(on(pro), pro, "YEARLY")).toBe("schedule");
    expect(planChange(on(pro, "ACTIVE", "YEARLY"), pro, "MONTHLY")).toBe("schedule");
    expect(planChange(on(pro), pro, "MONTHLY")).toBe("none");
  });

  it("in a trial: changes the period now, drops to free now, pays for another plan", () => {
    expect(planChange(on(pro, "TRIALING"), pro, "YEARLY")).toBe("apply");
    expect(planChange(on(pro, "TRIALING"), starter, "MONTHLY")).toBe("apply");
    expect(planChange(on(pro, "TRIALING"), enterprise, "MONTHLY")).toBe("pay");
    expect(planChange(on(enterprise, "TRIALING"), pro, "MONTHLY")).toBe("pay");
  });

  it("past due: free applies now, another plan is paid now, the same plan is renewed elsewhere", () => {
    expect(planChange(on(pro, "PAST_DUE"), starter, "MONTHLY")).toBe("apply");
    expect(planChange(on(enterprise, "PAST_DUE"), pro, "MONTHLY")).toBe("pay");
    expect(planChange(on(pro, "PAST_DUE"), pro, "YEARLY")).toBe("none");
  });
});
