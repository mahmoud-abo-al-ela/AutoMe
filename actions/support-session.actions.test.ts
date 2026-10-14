import { describe, it, expect, vi, beforeEach } from "vitest";

// The actions an admin must not take while signed in as a dealer, run through
// their composed exports so withAuth / withOrgAuth are part of what runs. Each
// case asserts the refusal and that the service behind it never ran.
vi.mock("@/lib/auth", () => ({ resolveAuthContext: vi.fn(), resolveTenantContext: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/super-admin/auth", () => ({ requireSuperAdmin: vi.fn() }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceRateLimit: vi.fn(), enforceDealerAiLimit: vi.fn() }));
vi.mock("@/lib/utils/revalidate", () => ({ revalidateLocalized: vi.fn(), revalidateRouteTree: vi.fn() }));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationById: vi.fn(), requireOwner: vi.fn() }));
vi.mock("@/lib/repositories/team", () => ({ countMembers: vi.fn() }));

const teamService = vi.hoisted(() => ({ inviteTeamMember: vi.fn(), changeMemberRole: vi.fn(), removeTeamMember: vi.fn() }));
vi.mock("@/lib/services/team", () => teamService);
const manage = vi.hoisted(() => ({ changePlan: vi.fn(), payRenewal: vi.fn(), cancelPlan: vi.fn(), keepCurrentPlan: vi.fn() }));
vi.mock("@/lib/services/billing/manage", () => manage);
vi.mock("@/lib/services/billing", () => ({}));
vi.mock("@/lib/services/billing/confirm", () => ({ confirmDealershipPayment: vi.fn(), confirmSignupPaymentFor: vi.fn() }));
const signup = vi.hoisted(() => ({ startSignupCheckout: vi.fn(), createUnpaidOrganization: vi.fn() }));
vi.mock("@/lib/services/billing/signup", () => signup);
vi.mock("@/lib/services/onboarding", () => ({ isSlugAvailable: vi.fn() }));
const carService = vi.hoisted(() => ({ deleteCar: vi.fn() }));
vi.mock("@/lib/services/car", () => carService);

import { resolveAuthContext, resolveTenantContext } from "@/lib/auth";
import type { TenantContext } from "@/lib/auth/context";
import { cancelPlan, changePlan, keepCurrentPlan, payRenewal } from "@/actions/billing";
import { createSignupCheckout } from "@/actions/payment";
import { createOrganization } from "@/actions/onboarding";
import { inviteTeamMember, removeMember, updateMemberRole } from "@/actions/team";
import { deleteCar } from "@/actions/cars";

const ORG_ID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";
const MEMBER_ID = "0e5d7c1a-1f1f-4b8a-9a0b-2d3c4e5f6a7b";

/** The context withAuth / withOrgAuth hand an action: the dealer, as the admin sees them, or the dealer themself. */
function context(isImpersonated: boolean) {
  return {
    userId: "clerk_admin",
    user: { id: "target-user", role: "USER", email: "t@x.eg", name: "Target", isImpersonated, memberships: [] },
    organization: { id: ORG_ID, slug: "dealer-b", subscription: { plan: { name: "Pro", maxMembers: -1, features: {} } } },
    membership: { role: "OWNER", organizationId: ORG_ID },
    isImpersonating: isImpersonated,
    actualUser: isImpersonated ? { id: "admin-user", role: "ADMIN" } : null,
  } as unknown as TenantContext;
}

function signedInAs(isImpersonated: boolean) {
  const ctx = context(isImpersonated);
  vi.mocked(resolveAuthContext).mockResolvedValue(ctx);
  vi.mocked(resolveTenantContext).mockResolvedValue(ctx);
}

const refused = { success: false, error: expect.objectContaining({ code: "AUTHORIZATION_ERROR" }) };

const guarded: Array<[string, () => Promise<unknown>, () => unknown[]]> = [
  ["changePlan", () => changePlan(ORG_ID, "plan-pro", "monthly", "en"), () => manage.changePlan.mock.calls],
  ["payRenewal", () => payRenewal(ORG_ID, "en"), () => manage.payRenewal.mock.calls],
  ["cancelPlan", () => cancelPlan(ORG_ID), () => manage.cancelPlan.mock.calls],
  ["keepCurrentPlan", () => keepCurrentPlan(ORG_ID), () => manage.keepCurrentPlan.mock.calls],
  ["createSignupCheckout", () => createSignupCheckout("plan-pro", "monthly", MEMBER_ID, "en"), () => signup.startSignupCheckout.mock.calls],
  ["createOrganization", () => createOrganization({} as never), () => signup.createUnpaidOrganization.mock.calls],
  ["inviteTeamMember", () => inviteTeamMember({ email: "new@x.eg", role: "MEMBER" }), () => teamService.inviteTeamMember.mock.calls],
  ["updateMemberRole", () => updateMemberRole({ memberId: MEMBER_ID, newRole: "MEMBER" }), () => teamService.changeMemberRole.mock.calls],
  ["removeMember", () => removeMember({ memberId: MEMBER_ID }), () => teamService.removeTeamMember.mock.calls],
  ["deleteCar", () => deleteCar("car-1"), () => carService.deleteCar.mock.calls],
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("during a support session", () => {
  beforeEach(() => signedInAs(true));

  it.each(guarded)("%s is refused before anything runs", async (_name, call, serviceCalls) => {
    expect(await call()).toMatchObject(refused);
    expect(serviceCalls()).toHaveLength(0);
  });
});

describe("outside a support session", () => {
  beforeEach(() => signedInAs(false));

  it("the dealer's own deleteCar still reaches the service", async () => {
    carService.deleteCar.mockResolvedValue({ message: "ok" });
    expect(await deleteCar("car-1")).toMatchObject({ success: true });
    expect(carService.deleteCar).toHaveBeenCalledWith("car-1", "clerk_admin", ORG_ID);
  });

  it("the dealer's own removeMember still reaches the service", async () => {
    expect(await removeMember({ memberId: MEMBER_ID })).toMatchObject({ success: true });
    expect(teamService.removeTeamMember).toHaveBeenCalled();
  });
});
