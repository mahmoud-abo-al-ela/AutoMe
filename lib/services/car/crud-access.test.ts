import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationError } from "@/lib/utils/errors";

const { findCarById, updateCar, deleteCarById, findUser, isImpersonatingOrganization } = vi.hoisted(() => ({
  findCarById: vi.fn(),
  updateCar: vi.fn(),
  deleteCarById: vi.fn(),
  findUser: vi.fn(),
  isImpersonatingOrganization: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ findCarById, updateCar, deleteCarById }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/services/impersonation/active", () => ({ isImpersonatingOrganization }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logCarChanged: vi.fn(), logCarDeleted: vi.fn() } }));
vi.mock("@/lib/services/storage", () => ({ deleteCarImages: vi.fn() }));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationById: vi.fn() }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged: vi.fn() }));

import { deleteCar, updateCar as updateCarService } from "@/lib/services/car/crud";

/**
 * Who may change a dealership's car: its members, and a platform admin in a
 * verified support session for exactly that dealership. The ADMIN role alone
 * opens nothing, and a session for one dealership opens nothing in another.
 */

const ORG_X = "org-x";
const ORG_Y = "org-y";
const admin = { id: "admin-db", email: "a@x.eg", role: "ADMIN", memberships: [] };
const member = { id: "member-db", email: "m@x.eg", role: "USER", memberships: [{ organizationId: ORG_X }] };
const outsider = { id: "outsider-db", email: "o@x.eg", role: "USER", memberships: [{ organizationId: "org-z" }] };

beforeEach(() => {
  vi.clearAllMocks();
  findCarById.mockImplementation(async (id: string) =>
    id === "car-x" ? { id, organizationId: ORG_X, images: [] } : { id, organizationId: ORG_Y, images: [] },
  );
  updateCar.mockResolvedValue({ id: "car-x" });
  isImpersonatingOrganization.mockResolvedValue(false);
});

describe("car changes need a membership or a verified session for that dealership", () => {
  it("refuses a platform ADMIN with no session, in any dealership", async () => {
    findUser.mockResolvedValue(admin);

    await expect(updateCarService("car-y", { status: "SOLD" }, "clerk_admin", ORG_Y)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(deleteCar("car-y", "clerk_admin", ORG_Y)).rejects.toBeInstanceOf(AuthorizationError);
    expect(updateCar).not.toHaveBeenCalled();
    expect(deleteCarById).not.toHaveBeenCalled();
  });

  it("keeps an admin in a session for X out of Y's car, even with the request aimed at X", async () => {
    findUser.mockResolvedValue(admin);
    isImpersonatingOrganization.mockImplementation(async (orgId: string) => orgId === ORG_X);

    await expect(updateCarService("car-y", { status: "SOLD" }, "clerk_admin", ORG_X)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(deleteCar("car-y", "clerk_admin", ORG_X)).rejects.toBeInstanceOf(AuthorizationError);
    expect(updateCar).not.toHaveBeenCalled();
    expect(deleteCarById).not.toHaveBeenCalled();
  });

  it("lets an admin in a verified session for X change X's car", async () => {
    findUser.mockResolvedValue(admin);
    isImpersonatingOrganization.mockImplementation(async (orgId: string) => orgId === ORG_X);

    await updateCarService("car-x", { status: "SOLD" }, "clerk_admin", ORG_X);

    expect(updateCar).toHaveBeenCalledWith("car-x", { status: "SOLD" });
  });

  it("refuses a non-member whose request names the victim's dealership — the forged-cookie case", async () => {
    findUser.mockResolvedValue(outsider);

    await expect(updateCarService("car-x", { status: "SOLD" }, "clerk_outsider", ORG_X)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(deleteCar("car-x", "clerk_outsider", ORG_X)).rejects.toBeInstanceOf(AuthorizationError);
    expect(updateCar).not.toHaveBeenCalled();
    expect(deleteCarById).not.toHaveBeenCalled();
  });

  it("lets a member change their own dealership's car, and no other", async () => {
    findUser.mockResolvedValue(member);

    await updateCarService("car-x", { status: "SOLD" }, "clerk_member", ORG_X);
    expect(updateCar).toHaveBeenCalledTimes(1);

    await expect(updateCarService("car-y", { status: "SOLD" }, "clerk_member", ORG_X)).rejects.toBeInstanceOf(AuthorizationError);
    expect(updateCar).toHaveBeenCalledTimes(1);
  });
});
