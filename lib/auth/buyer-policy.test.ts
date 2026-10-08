import { describe, it, expect } from "vitest";
import {
  BUYER_ACTIONS,
  buyerBlockReason,
  toBuyerViewer,
  type BuyerViewer,
} from "@/lib/auth/buyer-policy";

const TARGET = "org-target";

const buyer: BuyerViewer = { role: "USER", isImpersonated: false, organizationIds: [] };
const ownStaff: BuyerViewer = { role: "USER", isImpersonated: false, organizationIds: [TARGET] };
const otherStaff: BuyerViewer = { role: "USER", isImpersonated: false, organizationIds: ["org-other"] };
const admin: BuyerViewer = { role: "ADMIN", isImpersonated: false, organizationIds: [] };
// While impersonating, the session user is the dealer: role USER, their orgs.
const impersonating: BuyerViewer = { role: "USER", isImpersonated: true, organizationIds: [TARGET] };

describe("buyerBlockReason", () => {
  it.each(BUYER_ACTIONS)("lets a buyer %s", (action) => {
    expect(buyerBlockReason(buyer, TARGET, action)).toBeNull();
  });

  it.each(BUYER_ACTIONS)("never blocks a signed-out viewer (%s): sign-in handles them", (action) => {
    expect(buyerBlockReason(null, TARGET, action)).toBeNull();
  });

  it.each(BUYER_ACTIONS)("blocks a platform admin from %s", (action) => {
    expect(buyerBlockReason(admin, TARGET, action)).toBe("platformAdmin");
  });

  it.each(BUYER_ACTIONS)("blocks every %s while impersonating", (action) => {
    expect(buyerBlockReason(impersonating, TARGET, action)).toBe("impersonating");
    expect(buyerBlockReason(impersonating, "org-other", action)).toBe("impersonating");
  });

  it.each(BUYER_ACTIONS)("blocks a dealer's team from %s on their own dealership", (action) => {
    expect(buyerBlockReason(ownStaff, TARGET, action)).toBe("ownDealership");
  });

  it.each(["save", "message", "testDrive"] as const)(
    "lets a dealer's team %s at another dealership",
    (action) => {
      expect(buyerBlockReason(otherStaff, TARGET, action)).toBeNull();
    },
  );

  it("blocks any dealer's team from reviewing another dealership", () => {
    expect(buyerBlockReason(otherStaff, TARGET, "review")).toBe("dealerReview");
  });

  it("reports impersonation first, even for an admin's own session", () => {
    expect(buyerBlockReason({ ...admin, isImpersonated: true }, TARGET, "save")).toBe("impersonating");
  });
});

describe("toBuyerViewer", () => {
  it("keeps only what the policy reads", () => {
    expect(
      toBuyerViewer({
        role: "USER",
        memberships: [{ organizationId: "a" }, { organizationId: "b" }],
      }),
    ).toEqual({ role: "USER", isImpersonated: false, organizationIds: ["a", "b"] });
  });

  it("maps a missing user to null and missing memberships to none", () => {
    expect(toBuyerViewer(null)).toBeNull();
    expect(toBuyerViewer({ role: "ADMIN", isImpersonated: true })).toEqual({
      role: "ADMIN",
      isImpersonated: true,
      organizationIds: [],
    });
  });
});
