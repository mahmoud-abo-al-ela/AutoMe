import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateManyCars, findCarsByIds, findUser, logCarChanged } = vi.hoisted(() => ({
  updateManyCars: vi.fn(),
  findCarsByIds: vi.fn(),
  findUser: vi.fn(),
  logCarChanged: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ updateManyCars, findCarsByIds }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logCarChanged } }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/services/storage", () => ({}));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationById: vi.fn() }));

import { updateCars } from "@/lib/services/car/crud";
import { bulkCarUpdateSchema } from "@/lib/validations/schemas";

beforeEach(() => {
  updateManyCars.mockReset().mockResolvedValue(2);
  findCarsByIds.mockReset().mockResolvedValue([
    { id: "a", organizationId: "org-1", status: "AVAILABLE" },
    { id: "b", organizationId: "org-1", status: "AVAILABLE" },
  ]);
  logCarChanged.mockReset();
  findUser.mockReset().mockResolvedValue({ id: "db-user", email: "u@x.eg", role: "USER", memberships: [{ organizationId: "org-1" }] });
});

describe("updateCars", () => {
  it("writes only within the caller's organization, and reports how many changed", async () => {
    const count = await updateCars(["a", "b"], { status: "SOLD" }, "user-1", "org-1");

    expect(updateManyCars).toHaveBeenCalledWith(["a", "b"], "org-1", { status: "SOLD" });
    expect(count).toBe(2);
  });

  it("records the change on each car's activity, credited to the database user", async () => {
    await updateCars(["a", "b"], { status: "SOLD" }, "user-1", "org-1");

    expect(findCarsByIds).toHaveBeenCalledWith(["a", "b"], "org-1");
    expect(logCarChanged).toHaveBeenCalledTimes(2);
    expect(logCarChanged).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", status: "AVAILABLE" }),
      expect.objectContaining({ id: "a", status: "SOLD" }),
      { id: "db-user", email: "u@x.eg" },
    );
  });

  it("refuses someone outside the organization", async () => {
    findUser.mockResolvedValue({ role: "USER", memberships: [{ organizationId: "org-2" }] });

    await expect(updateCars(["a"], { featured: true }, "user-1", "org-1")).rejects.toThrow();
    expect(updateManyCars).not.toHaveBeenCalled();
  });
});

describe("bulkCarUpdateSchema", () => {
  it("needs at least one car and something to change", () => {
    expect(bulkCarUpdateSchema.safeParse({ carIds: [], status: "SOLD" }).success).toBe(false);
    expect(bulkCarUpdateSchema.safeParse({ carIds: ["a"] }).success).toBe(false);
  });

  it("caps a selection at 100 cars", () => {
    const carIds = Array.from({ length: 101 }, (_, i) => `car-${i}`);
    expect(bulkCarUpdateSchema.safeParse({ carIds, status: "SOLD" }).success).toBe(false);
  });
});
