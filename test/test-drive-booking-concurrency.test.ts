import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});
// The status change writes an audit entry; not what is under test here.
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logTestDriveStatusChanged: vi.fn() } }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { cancelTestDrive, editTestDrive, requestTestDrive } from "@/lib/services/test-drive/booking";
import { updateTestDriveStatus } from "@/lib/services/test-drive/status";
import { addDays } from "@/lib/utils/date-only";
import { cairoNow } from "@/lib/utils/datetime";
import { ValidationError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";

const ORG = "org_test_booking_race";
const OTHER = "org_test_booking_race_suspended";
const OWNER = "user_test_booking_owner";
const BUYERS = Array.from({ length: 10 }, (_, i) => `user_test_booking_buyer_${i}`);
const clerk = (id: string) => `clerk_${id}`;
let carId = "";
let hiddenCarId = "";
/** Two days ahead in Cairo: inside the booking window, never "past". */
const DAY = addDays(cairoNow().date, 2);

const taken = (results: PromiseSettledResult<unknown>[]) =>
  results.filter((r) => r.status === "rejected" && r.reason instanceof ValidationError && r.reason.messageKey === "errors.testDrive.slot.taken").length;
const booked = (results: PromiseSettledResult<unknown>[]) => results.filter((r) => r.status === "fulfilled").length;
const occupying = () => db.testDrive.count({ where: { carId, status: { in: ["PENDING", "CONFIRMED"] } } });

async function cleanUp() {
  await db.organization.deleteMany({ where: { id: { in: [ORG, OTHER] } } });
  await db.user.deleteMany({ where: { id: { in: [OWNER, ...BUYERS] } } });
}

describe.skipIf(!hasTestDb)("test-drive booking under concurrency (real Postgres)", () => {
  beforeAll(async () => {
    await cleanUp();
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Booking Race", slug: "test-booking-race", isActive: true },
        { id: OTHER, name: "Booking Suspended", slug: "test-booking-suspended", isActive: false },
      ],
    });
    await db.user.createMany({ data: [OWNER, ...BUYERS].map((id) => ({ id, clerkId: clerk(id) })) });
    await db.membership.create({ data: { userId: OWNER, organizationId: ORG, role: "OWNER" } });
    for (const organizationId of [ORG, OTHER]) {
      await db.workingHours.create({
        data: {
          organizationId,
          dayOfWeek: ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          openTime: "09:00",
          closeTime: "17:00",
          isOpen: true,
        },
      });
    }
    const car = (organizationId: string) =>
      db.car.create({
        data: {
          organizationId, make: "Toyota", model: "Corolla", year: 2020, price: 500_000, mileage: 1,
          fuelType: "Gasoline", transmission: "Automatic", color: "White", bodyType: "Sedan",
          status: "AVAILABLE", images: [], features: [],
        },
      });
    carId = (await car(ORG)).id;
    hiddenCarId = (await car(OTHER)).id;
  });

  beforeEach(() => db.testDrive.deleteMany({ where: { carId: { in: [carId, hiddenCarId] } } }));
  afterAll(cleanUp);

  const ask = (buyer: string, startTime: string, endTime: string) =>
    requestTestDrive({ carId, date: DAY, startTime, endTime }, clerk(buyer));

  it("ten buyers asking for the same slot at once: exactly one booking", async () => {
    const results = await Promise.allSettled(BUYERS.map((buyer) => ask(buyer, "10:00", "11:00")));
    expect(booked(results)).toBe(1);
    expect(taken(results)).toBe(9);
    expect(await occupying()).toBe(1);
  });

  it("overlapping ranges at once (10:00–11:00 and 10:30–11:30): one wins", async () => {
    const results = await Promise.allSettled([ask(BUYERS[0], "10:00", "11:00"), ask(BUYERS[1], "10:30", "11:30")]);
    expect(booked(results)).toBe(1);
    expect(taken(results)).toBe(1);
    expect(await occupying()).toBe(1);
  });

  it("the same buyer submitting twice at once books once, and both see that booking", async () => {
    const results = await Promise.allSettled([ask(BUYERS[2], "13:00", "14:00"), ask(BUYERS[2], "13:00", "14:00")]);
    expect(booked(results)).toBe(2);
    const ids = results.map((r) => (r as PromiseFulfilledResult<{ id: string }>).value.id);
    expect(ids[0]).toBe(ids[1]);
    expect(await occupying()).toBe(1);
  });

  it("two edits moving into overlapping times at once: one wins", async () => {
    const a = (await ask(BUYERS[3], "09:00", "10:00"))!;
    const b = (await ask(BUYERS[4], "11:00", "12:00"))!;
    const results = await Promise.allSettled([
      editTestDrive(a.id, { date: DAY, startTime: "14:00", endTime: "15:00" }, clerk(BUYERS[3])),
      editTestDrive(b.id, { date: DAY, startTime: "14:30", endTime: "15:30" }, clerk(BUYERS[4])),
    ]);
    expect(booked(results)).toBe(1);
    expect(taken(results)).toBe(1);
  });

  it("a cancelled booking frees its slot, and cannot be revived into it", async () => {
    const first = (await ask(BUYERS[5], "15:00", "16:00"))!;
    await cancelTestDrive(first.id, clerk(BUYERS[5]));
    const second = await ask(BUYERS[6], "15:00", "16:00");
    expect(second).toBeTruthy();

    await expect(updateTestDriveStatus(first.id, "PENDING", clerk(OWNER), ORG)).rejects.toMatchObject({
      messageKey: "errors.testDrive.invalidTransition",
    });
    await expect(updateTestDriveStatus(first.id, "CONFIRMED", clerk(OWNER), ORG)).rejects.toBeInstanceOf(ValidationError);
    expect(await occupying()).toBe(1);
  });

  it("the dealer's own moves still work: confirm, then complete", async () => {
    const drive = (await ask(BUYERS[7], "16:00", "17:00"))!;
    await updateTestDriveStatus(drive.id, "CONFIRMED", clerk(OWNER), ORG);
    await updateTestDriveStatus(drive.id, "COMPLETED", clerk(OWNER), ORG);
    await expect(updateTestDriveStatus(drive.id, "CANCELLED", clerk(OWNER), ORG)).rejects.toBeInstanceOf(ValidationError);
  });

  it("a suspended dealership's car cannot be booked", async () => {
    await expect(
      requestTestDrive({ carId: hiddenCarId, date: DAY, startTime: "10:00", endTime: "11:00" }, clerk(BUYERS[8]))
    ).rejects.toBeTruthy();
    expect(await db.testDrive.count({ where: { carId: hiddenCarId } })).toBe(0);
  });

  const statusOf = async (id: string) => (await db.testDrive.findUniqueOrThrow({ where: { id } })).status;

  it("a buyer's cancel and the dealer's confirm at the same moment: a cancel that succeeds always sticks", async () => {
    // Before the compare-and-set, both read PENDING and both wrote: the buyer
    // was told it was cancelled, the slot was freed, and the confirm landed on
    // top — a confirmed booking on a slot someone else could now take.
    for (const [start, end] of [["09:00", "10:00"], ["11:00", "12:00"], ["13:00", "14:00"], ["15:00", "16:00"]]) {
      const drive = (await ask(BUYERS[8], start, end))!;
      const [cancel, confirm] = await Promise.allSettled([
        cancelTestDrive(drive.id, clerk(BUYERS[8])),
        updateTestDriveStatus(drive.id, "CONFIRMED", clerk(OWNER), ORG),
      ]);
      const final = await statusOf(drive.id);
      if (cancel.status === "fulfilled") expect(final).toBe("CANCELLED");
      else expect(confirm.status === "fulfilled" && final === "CONFIRMED").toBe(true);
    }
  });

  it("an edit and the dealer's confirm at the same moment: a confirmed booking is never revived to PENDING", async () => {
    for (const [start, end, moveStart, moveEnd] of [
      ["09:00", "10:00", "13:00", "14:00"],
      ["10:00", "11:00", "14:00", "15:00"],
      ["11:00", "12:00", "15:00", "16:00"],
    ]) {
      const drive = (await ask(BUYERS[9], start, end))!;
      const [, confirm] = await Promise.allSettled([
        editTestDrive(drive.id, { date: DAY, startTime: moveStart, endTime: moveEnd }, clerk(BUYERS[9])),
        updateTestDriveStatus(drive.id, "CONFIRMED", clerk(OWNER), ORG),
      ]);
      if (confirm.status === "fulfilled") expect(await statusOf(drive.id)).toBe("CONFIRMED");
    }
  });
});
