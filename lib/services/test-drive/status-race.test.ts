import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError } from "@/lib/utils/errors";

const repo = vi.hoisted(() => ({
  findTestDriveById: vi.fn(),
  transitionTestDrive: vi.fn(),
  bookSlot: vi.fn(),
  findTestDrivesForSlotCheck: vi.fn(),
}));
vi.mock("@/lib/repositories/test-drive", () => repo);
const findUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/repositories/car", () => ({ findPublicCarById: vi.fn() }));
vi.mock("@/lib/repositories/dealership/working-hours", () => ({ findWorkingHours: vi.fn(async () => []) }));
vi.mock("@/lib/services/impersonation/active", () => ({ isImpersonatingOrganization: vi.fn(async () => false) }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logTestDriveStatusChanged: vi.fn() } }));

import { updateTestDriveStatus } from "@/lib/services/test-drive/status";
import { cancelTestDrive, editTestDrive } from "@/lib/services/test-drive/booking";

const ORG = "org-1";
const drive = (status: string) => ({ id: "td-1", organizationId: ORG, userId: "buyer-1", carId: "car-1", status, date: new Date(), startTime: "10:00" });

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockImplementation(async (clerkId: string) =>
    clerkId === "clerk_owner"
      ? { id: "owner-1", role: "USER", memberships: [{ organizationId: ORG, role: "OWNER" }] }
      : { id: "buyer-1", role: "USER", memberships: [] },
  );
});

describe("updateTestDriveStatus", () => {
  it("writes only from the status it validated, scoped by organization", async () => {
    repo.findTestDriveById.mockResolvedValue(drive("PENDING"));
    repo.transitionTestDrive.mockResolvedValue({ ...drive("CONFIRMED") });

    await updateTestDriveStatus("td-1", "confirmed", "clerk_owner", ORG);

    expect(repo.transitionTestDrive).toHaveBeenCalledWith("td-1", ORG, ["PENDING"], { status: "CONFIRMED" });
  });

  it("refuses with a conflict when the buyer cancelled it in between", async () => {
    repo.findTestDriveById.mockResolvedValue(drive("PENDING"));
    repo.transitionTestDrive.mockResolvedValue(null);

    await expect(updateTestDriveStatus("td-1", "CONFIRMED", "clerk_owner", ORG)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("cancelTestDrive", () => {
  it("cancels only a booking still pending or confirmed, and says so when it no longer is", async () => {
    repo.findTestDriveById.mockResolvedValue(drive("PENDING"));
    repo.transitionTestDrive.mockResolvedValue(null);

    await expect(cancelTestDrive("td-1", "clerk_buyer")).rejects.toMatchObject({ messageKey: "errors.testDrive.changed" });
    expect(repo.transitionTestDrive).toHaveBeenCalledWith("td-1", ORG, ["PENDING", "CONFIRMED"], { status: "CANCELLED" });
  });
});

describe("editTestDrive", () => {
  it("refuses when the booking stopped being PENDING before the lock", async () => {
    repo.findTestDriveById.mockResolvedValue(drive("PENDING"));
    // bookSlot re-checks under the car-day lock: confirmed meanwhile.
    repo.bookSlot.mockResolvedValue(null);

    await expect(
      editTestDrive("td-1", { date: "2026-10-20", startTime: "10:00", endTime: "11:00" }, "clerk_buyer"),
    ).rejects.toMatchObject({ messageKey: "errors.testDrive.notEditable" });
    expect(repo.bookSlot).toHaveBeenCalledWith(
      expect.objectContaining({ carId: "car-1" }),
      expect.objectContaining({ kind: "move", testDriveId: "td-1" }),
      expect.any(Function),
    );
  });
});
