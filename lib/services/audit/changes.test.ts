import { describe, it, expect, vi, beforeEach } from "vitest";

const { createAuditLog } = vi.hoisted(() => ({ createAuditLog: vi.fn() }));
vi.mock("./audit", () => ({ createAuditLog }));

import { logCarChanged } from "./car";
import { logSettingsChanged } from "./settings";
import { logTestDriveStatusChanged } from "./test-drive";

const actor = { id: "db-user", email: "owner@x.eg" };
const car = { id: "car-1", organizationId: "org-1", make: "Hyundai", model: "Tucson", year: 2022, price: "1250000", status: "AVAILABLE", featured: false };

beforeEach(() => createAuditLog.mockReset());

describe("car activity", () => {
  it("records only the fields that changed, with the price as a number", async () => {
    await logCarChanged(car, { ...car, price: 1190000, mileage: undefined }, actor);

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CAR_UPDATED",
        userId: "db-user",
        oldValue: { price: 1250000 },
        newValue: { price: 1190000 },
        metadata: { car: { make: "Hyundai", model: "Tucson", year: 2022 } },
      }),
    );
  });

  it("names a status-only change and a featured-only change for what they are", async () => {
    await logCarChanged(car, { ...car, status: "SOLD" }, actor);
    await logCarChanged(car, { ...car, featured: true }, actor);

    expect(createAuditLog.mock.calls.map(([entry]) => entry.action)).toEqual(["CAR_STATUS_CHANGED", "CAR_FEATURED_TOGGLED"]);
  });

  it("logs nothing when nothing it describes changed", async () => {
    await logCarChanged(car, { ...car }, actor);
    expect(createAuditLog).not.toHaveBeenCalled();
  });
});

describe("settings activity", () => {
  it("keeps only the changed keys", async () => {
    await logSettingsChanged({
      action: "WORKING_HOURS_UPDATED",
      entityType: "WORKING_HOURS",
      organizationId: "org-1",
      before: { SATURDAY: "10:00-21:00", WEDNESDAY: "10:00-21:00" },
      after: { SATURDAY: "10:00-21:00", WEDNESDAY: "10:00-22:00" },
      actor,
    });

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ oldValue: { WEDNESDAY: "10:00-21:00" }, newValue: { WEDNESDAY: "10:00-22:00" } }),
    );
  });

  it("logs nothing for a save that changed nothing", async () => {
    await logSettingsChanged({ action: "ORG_SETTINGS_UPDATED", entityType: "ORGANIZATION", organizationId: "org-1", before: { acceptsTradeIn: true }, after: { acceptsTradeIn: true }, actor });
    expect(createAuditLog).not.toHaveBeenCalled();
  });
});

describe("test drive activity", () => {
  it("logs a confirmation with the car and slot, and skips statuses without an action", async () => {
    const drive = { id: "td-1", organizationId: "org-1", carId: "car-1", date: new Date("2026-10-08T00:00:00Z"), startTime: "17:00" };
    await logTestDriveStatusChanged({ ...drive, status: "CONFIRMED" }, "PENDING", actor);
    await logTestDriveStatusChanged({ ...drive, status: "NO_SHOW" }, "CONFIRMED", actor);

    expect(createAuditLog).toHaveBeenCalledTimes(1);
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "TEST_DRIVE_CONFIRMED",
        newValue: { status: "CONFIRMED", carId: "car-1", date: "2026-10-08", startTime: "17:00" },
      }),
    );
  });
});
