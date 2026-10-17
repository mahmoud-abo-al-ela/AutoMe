import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlanLimitError } from "@/lib/utils/errors";

const { createCarWithinLimit, findUser, getOrganizationById, planInEffect, uploadCarImages, deleteCarImages, logCarCreated } = vi.hoisted(() => ({
  createCarWithinLimit: vi.fn(),
  findUser: vi.fn(),
  getOrganizationById: vi.fn(),
  planInEffect: vi.fn(),
  uploadCarImages: vi.fn(),
  deleteCarImages: vi.fn(),
  logCarCreated: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ createCarWithinLimit }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationById }));
vi.mock("@/lib/services/billing/entitlements", () => ({ planInEffect }));
vi.mock("@/lib/services/storage", () => ({ uploadCarImages, deleteCarImages }));
vi.mock("@/lib/services/impersonation/active", () => ({ isImpersonatingOrganization: vi.fn(async () => false) }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logCarCreated } }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged: vi.fn() }));

import { createCar } from "@/lib/services/car/crud";
import type { CarInput } from "@/lib/validations/schemas";

const ORG = "org-1";
const input = { title: "Corolla", make: "Toyota", model: "Corolla", year: 2020, price: 1, mileage: 1, images: ["data:image/png;base64,AA=="] } as unknown as CarInput;

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockResolvedValue({ id: "db-user", email: "m@x.eg", role: "USER", memberships: [{ organizationId: ORG }] });
  getOrganizationById.mockResolvedValue({ id: ORG, slug: "dealer", subscription: {} });
  planInEffect.mockResolvedValue({ name: "Starter", maxCars: 15, maxImagesPerCar: 5 });
  uploadCarImages.mockResolvedValue(["https://cdn.test/cars/x/1.jpg"]);
  deleteCarImages.mockResolvedValue(undefined);
});

describe("createCar at the plan's car limit", () => {
  it("passes the limit of the plan in effect to the locked insert", async () => {
    createCarWithinLimit.mockResolvedValue({ id: "car-1" });
    await createCar(input, "clerk_m", ORG);
    expect(createCarWithinLimit).toHaveBeenCalledWith(expect.objectContaining({ organizationId: ORG }), 15);
  });

  it("refuses when another save took the last place, removing the photos it uploaded", async () => {
    createCarWithinLimit.mockResolvedValue(null);

    await expect(createCar(input, "clerk_m", ORG)).rejects.toBeInstanceOf(PlanLimitError);
    expect(deleteCarImages).toHaveBeenCalledWith(["https://cdn.test/cars/x/1.jpg"], expect.any(String));
    expect(logCarCreated).not.toHaveBeenCalled();
  });

  it("takes the photo limit from the plan in effect too (a lapsed paid plan reads as the free one)", async () => {
    planInEffect.mockResolvedValue({ name: "Starter", maxCars: 15, maxImagesPerCar: 5 });
    createCarWithinLimit.mockResolvedValue({ id: "car-1" });
    await createCar(input, "clerk_m", ORG);
    expect(uploadCarImages).toHaveBeenCalledWith(expect.anything(), expect.any(String), "car-images", 5);
  });
});
