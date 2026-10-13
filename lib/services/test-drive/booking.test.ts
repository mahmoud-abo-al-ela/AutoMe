import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SlotCheck, SlotRange, SlotRequest, SlotWrite } from "@/lib/repositories/test-drive/booking";

const mocks = vi.hoisted(() => ({
  findUserByClerkId: vi.fn(),
  findUserByClerkIdWithMemberships: vi.fn(),
  findPublicCarById: vi.fn(),
  findWorkingHours: vi.fn(),
  findTestDriveById: vi.fn(),
  bookSlot: vi.fn(),
  /** What bookSlot finds inside its lock: the car as bookable, and the day's bookings. */
  inLock: { car: { id: "car-1", organizationId: "org-1" } as { id: string; organizationId: string } | null, booked: [] as SlotRange[] },
}));
vi.mock("@/lib/repositories/user", () => ({
  findUserByClerkId: mocks.findUserByClerkId,
  findUserByClerkIdWithMemberships: mocks.findUserByClerkIdWithMemberships,
}));
vi.mock("@/lib/repositories/car", () => ({ findPublicCarById: mocks.findPublicCarById }));
vi.mock("@/lib/repositories/dealership/working-hours", () => ({ findWorkingHours: mocks.findWorkingHours }));
vi.mock("@/lib/repositories/test-drive", () => ({
  findTestDriveById: mocks.findTestDriveById,
  bookSlot: mocks.bookSlot,
}));

import { editTestDrive, requestTestDrive } from "@/lib/services/test-drive/booking";
import { ValidationError } from "@/lib/utils/errors";

/**
 * The booking rules run inside bookSlot's lock (repositories/test-drive/
 * booking.ts): these pin that create and edit hand it the right slot and a
 * check that applies the dealership's real hours and the bookings found in
 * the lock. The rules themselves: lib/utils/booking-slots.test.ts; the lock
 * under real concurrency: test/test-drive-booking-concurrency.test.ts.
 */

// Thursday 1 October 2026, 11:00 in Cairo. Saturday the 3rd is open 09-17,
// Friday the 2nd is closed.
const NOW = new Date("2026-10-01T08:00:00Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mocks.inLock.car = { id: "car-1", organizationId: "org-1" };
  mocks.inLock.booked = [{ startTime: "11:00", endTime: "12:00" }];
  mocks.findUserByClerkId.mockResolvedValue({ id: "user-1" });
  mocks.findPublicCarById.mockResolvedValue({ id: "car-1", status: "AVAILABLE", organizationId: "org-1" });
  mocks.findWorkingHours.mockResolvedValue([
    { dayOfWeek: "SATURDAY", openTime: "09:00", closeTime: "17:00", isOpen: true },
    { dayOfWeek: "FRIDAY", openTime: "", closeTime: "", isOpen: false },
  ]);
  mocks.bookSlot.mockImplementation(async (request: SlotRequest, write: SlotWrite, check: SlotCheck) => {
    check(mocks.inLock);
    return { id: write.kind === "create" ? "td-new" : write.testDriveId, ...request };
  });
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
  it("books a free slot through the lock, on that car's calendar day", async () => {
    await request("2026-10-03", "09:00", "10:00");

    const [slot, write] = mocks.bookSlot.mock.calls[0];
    expect(slot).toMatchObject({ carId: "car-1", day: "2026-10-03", startTime: "09:00", endTime: "10:00" });
    expect(slot.date.toISOString()).toBe("2026-10-03T00:00:00.000Z");
    expect(write).toEqual({ kind: "create", userId: "user-1", notes: "" });
  });

  it("refuses a day the dealership is closed", async () => {
    expect(await rejection(request("2026-10-02", "10:00", "11:00"))).toBe("errors.testDrive.slot.closed");
  });

  it("refuses a slot that overlaps a booking found inside the lock", async () => {
    expect(await rejection(request("2026-10-03", "10:30", "11:30"))).toBe("errors.testDrive.slot.taken");
  });

  it("refuses a car that stopped being bookable before the lock was taken", async () => {
    mocks.inLock.car = null;
    expect(await rejection(request("2026-10-03", "09:00", "10:00"))).toBe("errors.testDrive.carUnavailable");
  });

  it("refuses a date in the past", async () => {
    expect(await rejection(request("2026-09-30", "10:00", "11:00"))).toBe("errors.testDrive.slot.outsideWindow");
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
  });

  it("moves the booking through the lock, checked against every other booking", async () => {
    mocks.inLock.booked = [];
    await editTestDrive("td-1", { date: "2026-10-03", startTime: "14:00", endTime: "15:00" }, "clerk_1");

    const [slot, write] = mocks.bookSlot.mock.calls[0];
    expect(slot).toMatchObject({ carId: "car-1", day: "2026-10-03", startTime: "14:00" });
    expect(write).toEqual({ kind: "move", testDriveId: "td-1", notes: "" });
  });

  it("refuses moving it outside working hours", async () => {
    expect(
      await rejection(editTestDrive("td-1", { date: "2026-10-03", startTime: "18:00", endTime: "19:00" }, "clerk_1"))
    ).toBe("errors.testDrive.slot.outsideHours");
  });
});
