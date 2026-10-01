import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findUserByClerkId: vi.fn(),
  findUserByClerkIdWithMemberships: vi.fn(),
  findCarById: vi.fn(),
  findWorkingHours: vi.fn(),
  getBookedTimeSlots: vi.fn(),
  createTestDrive: vi.fn(),
  updateTestDrive: vi.fn(),
  findTestDriveById: vi.fn(),
}));
vi.mock("@/lib/repositories/user", () => ({
  findUserByClerkId: mocks.findUserByClerkId,
  findUserByClerkIdWithMemberships: mocks.findUserByClerkIdWithMemberships,
}));
vi.mock("@/lib/repositories/car", () => ({ findCarById: mocks.findCarById }));
vi.mock("@/lib/repositories/dealership/working-hours", () => ({
  findWorkingHours: mocks.findWorkingHours,
}));
vi.mock("@/lib/repositories/test-drive", () => ({
  getBookedTimeSlots: mocks.getBookedTimeSlots,
  createTestDrive: mocks.createTestDrive,
  updateTestDrive: mocks.updateTestDrive,
  findTestDriveById: mocks.findTestDriveById,
}));

import { editTestDrive, requestTestDrive } from "@/lib/services/test-drive/booking";
import { ValidationError } from "@/lib/utils/errors";

/**
 * The server is where the booking rules are enforced; these pin that they
 * actually run on create and edit, against the dealership's real hours and
 * the car's existing bookings. The rules themselves are covered in
 * lib/utils/booking-slots.test.ts.
 */

// Thursday 1 October 2026, 11:00 in Cairo. Saturday the 3rd is open 09-17,
// Friday the 2nd is closed.
const NOW = new Date("2026-10-01T08:00:00Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mocks.findUserByClerkId.mockResolvedValue({ id: "user-1" });
  mocks.findCarById.mockResolvedValue({ id: "car-1", status: "AVAILABLE", organizationId: "org-1" });
  mocks.findWorkingHours.mockResolvedValue([
    { dayOfWeek: "SATURDAY", openTime: "09:00", closeTime: "17:00", isOpen: true },
    { dayOfWeek: "FRIDAY", openTime: "", closeTime: "", isOpen: false },
  ]);
  mocks.getBookedTimeSlots.mockResolvedValue([{ startTime: "11:00", endTime: "12:00" }]);
  mocks.createTestDrive.mockImplementation(async (data) => ({ id: "td-new", ...data }));
});

afterEach(() => vi.useRealTimers());

const request = (date: string, startTime: string, endTime: string) =>
  requestTestDrive({ carId: "car-1", date, startTime, endTime }, "clerk_1");

async function rejection(promise: Promise<unknown>) {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(ValidationError);
  return (error as ValidationError).messageKey;
}

describe("requestTestDrive", () => {
  it("stores a free slot, with the date at midnight UTC on that calendar day", async () => {
    await request("2026-10-03", "09:00", "10:00");

    expect(mocks.createTestDrive).toHaveBeenCalledOnce();
    expect(mocks.createTestDrive.mock.calls[0][0].date.toISOString()).toBe(
      "2026-10-03T00:00:00.000Z"
    );
    expect(mocks.getBookedTimeSlots).toHaveBeenCalledWith("car-1", "2026-10-03", undefined);
  });

  it("refuses a day the dealership is closed", async () => {
    expect(await rejection(request("2026-10-02", "10:00", "11:00"))).toBe(
      "errors.testDrive.slot.closed"
    );
    expect(mocks.createTestDrive).not.toHaveBeenCalled();
  });

  it("refuses a slot that overlaps an existing booking", async () => {
    expect(await rejection(request("2026-10-03", "10:30", "11:30"))).toBe(
      "errors.testDrive.slot.taken"
    );
  });

  it("refuses a date in the past", async () => {
    expect(await rejection(request("2026-09-30", "10:00", "11:00"))).toBe(
      "errors.testDrive.slot.outsideWindow"
    );
  });
});

describe("editTestDrive", () => {
  beforeEach(() => {
    mocks.findUserByClerkIdWithMemberships.mockResolvedValue({ id: "user-1", role: "USER", memberships: [] });
    mocks.findTestDriveById.mockResolvedValue({
      id: "td-1",
      userId: "user-1",
      carId: "car-1",
      organizationId: "org-1",
      status: "PENDING",
    });
    mocks.updateTestDrive.mockImplementation(async (id, data) => ({ id, ...data }));
  });

  it("checks the new time against every booking but this one", async () => {
    mocks.getBookedTimeSlots.mockResolvedValue([]);
    await editTestDrive("td-1", { date: "2026-10-03", startTime: "14:00", endTime: "15:00" }, "clerk_1");

    expect(mocks.getBookedTimeSlots).toHaveBeenCalledWith("car-1", "2026-10-03", "td-1");
    expect(mocks.updateTestDrive).toHaveBeenCalledOnce();
  });

  it("refuses moving it outside working hours", async () => {
    expect(
      await rejection(
        editTestDrive("td-1", { date: "2026-10-03", startTime: "18:00", endTime: "19:00" }, "clerk_1")
      )
    ).toBe("errors.testDrive.slot.outsideHours");
    expect(mocks.updateTestDrive).not.toHaveBeenCalled();
  });
});
