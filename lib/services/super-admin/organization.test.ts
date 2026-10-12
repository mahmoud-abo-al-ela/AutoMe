import { describe, it, expect, vi, beforeEach } from "vitest";

const { orgRepo, searchTermsChanged, order } = vi.hoisted(() => {
  const order: string[] = [];
  return {
    order,
    searchTermsChanged: vi.fn(async () => {
      order.push("vocabulary");
    }),
    orgRepo: {
      updateOrganizationStatus: vi.fn(async () => {
        order.push("write");
        return { id: "org-1" };
      }),
      findOrganizationForDeletion: vi.fn(),
      deleteOrganizationWithRelations: vi.fn(async () => {
        order.push("write");
      }),
    },
  };
});
vi.mock("@/lib/repositories/super-admin/organization", () => orgRepo);
vi.mock("@/lib/repositories/super-admin/plan", () => ({}));
vi.mock("@/lib/repositories/super-admin/user", () => ({}));
vi.mock("@/lib/repositories/super-admin/membership", () => ({}));
vi.mock("@/lib/repositories/team", () => ({}));
vi.mock("@/lib/services/super-admin/email", () => ({ sendOrganizationInvitationEmail: vi.fn() }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged }));

import { deleteOrganization, updateOrganizationStatus } from "@/lib/services/super-admin/organization";

/** Suspending, activating or deleting a dealership changes which cars are public. */

beforeEach(() => {
  vi.clearAllMocks();
  order.length = 0;
});

describe("dealership visibility and the search's vocabulary", () => {
  it("refreshes after a suspension or activation is written", async () => {
    await updateOrganizationStatus("org-1", false);
    expect(orgRepo.updateOrganizationStatus).toHaveBeenCalledWith("org-1", false);
    expect(order).toEqual(["write", "vocabulary"]);
  });

  it("refreshes after a deletion is written", async () => {
    orgRepo.findOrganizationForDeletion.mockResolvedValue({ id: "org-1", name: "Nile Motors", slug: "nile-motors" });
    await deleteOrganization("org-1");
    expect(order).toEqual(["write", "vocabulary"]);
  });

  it("does not refresh when there is nothing to delete", async () => {
    orgRepo.findOrganizationForDeletion.mockResolvedValue(null);
    await expect(deleteOrganization("org-1")).rejects.toThrow();
    expect(searchTermsChanged).not.toHaveBeenCalled();
  });
});
