import { describe, it, expect, vi } from "vitest";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { PlanLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

// Partial fixture: the gate only reads organization.subscription.plan.features.
function ctxWith(features: unknown): TenantContext {
  return ({
    organization: {
      id: "org-1",
      slug: "dealer-a",
      subscription: { plan: { name: "Pro", features } },
    },
  } as unknown) as TenantContext;
}

describe("withPlanGate", () => {
  it("runs the action when the feature is enabled (object form)", async () => {
    const inner = vi.fn().mockResolvedValue("ran");
    const guarded = withPlanGate("aiProcessing", inner);

    await expect(guarded(ctxWith({ aiProcessing: { enabled: true } }), "arg")).resolves.toBe("ran");
    expect(inner).toHaveBeenCalledWith(ctxWith({ aiProcessing: { enabled: true } }), "arg");
  });

  it("runs the action when the feature is enabled (boolean form)", async () => {
    const inner = vi.fn().mockResolvedValue("ran");
    const guarded = withPlanGate("aiProcessing", inner);

    await expect(guarded(ctxWith({ aiProcessing: true }))).resolves.toBe("ran");
  });

  it("blocks with PlanLimitError when the feature is disabled", async () => {
    const inner = vi.fn();
    const guarded = withPlanGate("aiProcessing", inner);

    await expect(guarded(ctxWith({ aiProcessing: { enabled: false } }))).rejects.toBeInstanceOf(
      PlanLimitError,
    );
    expect(inner).not.toHaveBeenCalled();
  });

  it("blocks when the feature key is absent entirely", async () => {
    const guarded = withPlanGate("aiProcessing", vi.fn());
    await expect(guarded(ctxWith({}))).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("blocks when the org has no plan", async () => {
    const guarded = withPlanGate("aiProcessing", vi.fn());
    await expect(
      guarded({ organization: { subscription: {} } } as unknown as TenantContext)
    ).rejects.toBeInstanceOf(
      PlanLimitError,
    );
  });
});
