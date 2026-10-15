import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

const { findCarById, updateCar, findUser, getOrganizationById, deleteCarImages, uploadCarImages } = vi.hoisted(() => ({
  findCarById: vi.fn(),
  updateCar: vi.fn(),
  findUser: vi.fn(),
  getOrganizationById: vi.fn(),
  deleteCarImages: vi.fn(),
  uploadCarImages: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ findCarById, updateCar }));
vi.mock("@/lib/repositories/user", () => ({ findUserByClerkIdWithMemberships: findUser }));
vi.mock("@/lib/services/impersonation/active", () => ({ isImpersonatingOrganization: vi.fn(async () => false) }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logCarChanged: vi.fn() } }));
vi.mock("@/lib/services/storage", () => ({ deleteCarImages, uploadCarImages }));
vi.mock("@/lib/getOrganization", () => ({ getOrganizationById }));
vi.mock("@/lib/jobs/search-terms", () => ({ searchTermsChanged: vi.fn() }));

import { updateCarFull } from "@/lib/services/car/crud";
import type { UpdateCarFullInput } from "@/lib/validations/schemas";

/**
 * A full edit's photos: each one is either a photo this car already has, by
 * its stored URL, or a new upload. The plan's limit counts both. Nothing is
 * deleted or uploaded until the whole list has passed.
 */

const ORG = "org-x";
const STORED = ["https://cdn.test/cars/car-1/a.jpg", "https://cdn.test/cars/car-1/b.jpg"];
const OTHER_TENANTS = "https://cdn.test/cars/someone-elses-car/x.jpg";
const DATA_URL = "data:image/png;base64,iVBORw0KGgo=";

function edit(images: Array<string | File>) {
  return {
    title: "Corolla",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 500000,
    mileage: 1000,
    bodyType: "Sedan",
    fuelType: "Gasoline",
    transmission: "Automatic",
    color: "White",
    seats: 5,
    status: "AVAILABLE",
    images,
  } as unknown as UpdateCarFullInput;
}

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockResolvedValue({ id: "db-user", email: "m@x.eg", role: "USER", memberships: [{ organizationId: ORG }] });
  findCarById.mockResolvedValue({ id: "car-1", organizationId: ORG, images: STORED, status: "AVAILABLE" });
  getOrganizationById.mockResolvedValue({ id: ORG, subscription: { plan: { maxImagesPerCar: 3 } } });
  deleteCarImages.mockResolvedValue(undefined);
  uploadCarImages.mockImplementation(async (files: unknown[]) => files.map((_, i) => `https://cdn.test/cars/car-1/new-${i}.jpg`));
  updateCar.mockImplementation(async (id: string, _org: string, data: object) => ({ id, ...data }));
});

describe("updateCarFull photos", () => {
  it("refuses a URL the car does not have — another dealership's photo — and touches nothing", async () => {
    await expect(updateCarFull("car-1", edit([STORED[0], OTHER_TENANTS]), "clerk_m", ORG)).rejects.toMatchObject({
      messageKey: "errors.upload.notThisCar",
    });
    expect(deleteCarImages).not.toHaveBeenCalled();
    expect(uploadCarImages).not.toHaveBeenCalled();
    expect(updateCar).not.toHaveBeenCalled();
  });

  it("counts kept and new photos together against the plan's limit", async () => {
    const tooMany = edit([...STORED, DATA_URL, new File(["x"], "x.png", { type: "image/png" })]);

    await expect(updateCarFull("car-1", tooMany, "clerk_m", ORG)).rejects.toBeInstanceOf(ValidationError);
    expect(deleteCarImages).not.toHaveBeenCalled();
    expect(uploadCarImages).not.toHaveBeenCalled();
  });

  it("keeps the car's own photos, uploads new ones (files or data: URLs) and drops the rest", async () => {
    const file = new File(["x"], "x.png", { type: "image/png" });

    await updateCarFull("car-1", edit([STORED[1], DATA_URL, file]), "clerk_m", ORG);

    expect(deleteCarImages).toHaveBeenCalledWith([STORED[0]], "car-1");
    expect(uploadCarImages).toHaveBeenCalledWith([DATA_URL, file], "car-1", "car-images", 3);
    expect(updateCar).toHaveBeenCalledWith(
      "car-1",
      ORG,
      expect.objectContaining({
        images: [STORED[1], "https://cdn.test/cars/car-1/new-0.jpg", "https://cdn.test/cars/car-1/new-1.jpg"],
      }),
    );
  });

  it("is NotFound when the scoped write matches no car of this dealership", async () => {
    updateCar.mockResolvedValue(null);
    await expect(updateCarFull("car-1", edit([STORED[0]]), "clerk_m", ORG)).rejects.toBeInstanceOf(NotFoundError);
  });
});

/**
 * A removed photo is deleted only after the car row stops listing it, so an
 * edit that fails part-way never leaves the car pointing at deleted files.
 */
describe("updateCarFull photo order", () => {
  it("deletes a removed photo only after the write", async () => {
    await updateCarFull("car-1", edit([STORED[1], DATA_URL]), "clerk_m", ORG);

    expect(uploadCarImages.mock.invocationCallOrder[0]).toBeLessThan(updateCar.mock.invocationCallOrder[0]);
    expect(updateCar.mock.invocationCallOrder[0]).toBeLessThan(deleteCarImages.mock.invocationCallOrder[0]);
  });

  it("leaves storage and the car untouched when the upload fails", async () => {
    uploadCarImages.mockRejectedValue(new Error("Upload failed: storage unavailable"));

    await expect(updateCarFull("car-1", edit([STORED[1], DATA_URL]), "clerk_m", ORG)).rejects.toThrow("Upload failed");
    expect(deleteCarImages).not.toHaveBeenCalled();
    expect(updateCar).not.toHaveBeenCalled();
  });

  it("keeps the car's photos and discards the new uploads when the write fails", async () => {
    updateCar.mockRejectedValue(new Error("connection reset"));

    await expect(updateCarFull("car-1", edit([STORED[1], DATA_URL]), "clerk_m", ORG)).rejects.toThrow("connection reset");
    expect(deleteCarImages).toHaveBeenCalledTimes(1);
    expect(deleteCarImages).toHaveBeenCalledWith(["https://cdn.test/cars/car-1/new-0.jpg"], "car-1");
  });

  it("discards the new uploads when the write matches no car", async () => {
    updateCar.mockResolvedValue(null);

    await expect(updateCarFull("car-1", edit([STORED[1], DATA_URL]), "clerk_m", ORG)).rejects.toBeInstanceOf(NotFoundError);
    expect(deleteCarImages).toHaveBeenCalledTimes(1);
    expect(deleteCarImages).toHaveBeenCalledWith(["https://cdn.test/cars/car-1/new-0.jpg"], "car-1");
  });

  it("still reports the write's error when discarding the uploads fails too", async () => {
    updateCar.mockRejectedValue(new Error("connection reset"));
    deleteCarImages.mockRejectedValue(new Error("Delete failed"));

    await expect(updateCarFull("car-1", edit([DATA_URL]), "clerk_m", ORG)).rejects.toThrow("connection reset");
  });
});
