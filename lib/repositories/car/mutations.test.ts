import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({ car: { update: vi.fn(), deleteMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/utils/serializers", () => ({ serializeCar: (car: unknown) => car }));

import { deleteCarById, updateCar } from "@/lib/repositories/car/mutations";

/** A car is written only within its dealership: the organization is in the WHERE, not a caller's promise. */

beforeEach(() => vi.clearAllMocks());

describe("updateCar", () => {
  it("scopes the write by organization", async () => {
    db.car.update.mockResolvedValue({ id: "car-1" });

    await updateCar("car-1", "org-x", { status: "SOLD" });

    expect(db.car.update).toHaveBeenCalledWith({ where: { id: "car-1", organizationId: "org-x" }, data: { status: "SOLD" } });
  });

  it("is null when no car of that dealership matched", async () => {
    db.car.update.mockRejectedValue(Object.assign(new Error("No record"), { code: "P2025" }));
    expect(await updateCar("car-1", "org-y", { status: "SOLD" })).toBeNull();
  });

  it("rethrows any other failure", async () => {
    db.car.update.mockRejectedValue(Object.assign(new Error("boom"), { code: "P1001" }));
    await expect(updateCar("car-1", "org-x", {})).rejects.toThrow("boom");
  });
});

describe("deleteCarById", () => {
  it("deletes only within the organization, and says how many", async () => {
    db.car.deleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteCarById("car-1", "org-y")).toBe(0);
    expect(db.car.deleteMany).toHaveBeenCalledWith({ where: { id: "car-1", organizationId: "org-y" } });
  });
});
