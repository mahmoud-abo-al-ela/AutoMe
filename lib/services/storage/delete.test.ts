import { describe, it, expect, vi, beforeEach } from "vitest";

const remove = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn(() => ({ remove })));
vi.mock("@/lib/supabase", () => ({
  createAdminClient: () => ({ storage: { from } }),
  createClient: vi.fn(),
}));

import { deleteCarImages, storagePathOf } from "@/lib/services/storage/delete";

const BASE = "https://proj.supabase.co/storage/v1/object/public/car-images";

beforeEach(() => {
  vi.clearAllMocks();
  remove.mockResolvedValue({ data: [], error: null });
});

describe("storagePathOf", () => {
  it("reads the object path out of a public URL, as getPublicUrl builds it", () => {
    expect(storagePathOf(`${BASE}/cars/car-1/image-1.jpg`, "car-images")).toBe("cars/car-1/image-1.jpg");
    expect(storagePathOf(`${BASE}/cars/car-1/a%20b.jpg?width=200`, "car-images")).toBe("cars/car-1/a b.jpg");
  });

  it("is null for another bucket or any other URL", () => {
    expect(storagePathOf(`${BASE}/cars/car-1/image-1.jpg`, "organization-logos")).toBeNull();
    expect(storagePathOf("https://elsewhere.example/cars/car-1/x.jpg", "car-images")).toBeNull();
  });
});

describe("deleteCarImages", () => {
  it("removes the photos where uploads put them — cars/<carId>/…, not the URL's last two segments", async () => {
    await deleteCarImages([`${BASE}/cars/car-1/image-1.jpg`, `${BASE}/cars/car-1/image-2.jpg`], "car-1");

    expect(from).toHaveBeenCalledWith("car-images");
    expect(remove).toHaveBeenCalledWith(["cars/car-1/image-1.jpg", "cars/car-1/image-2.jpg"]);
  });

  it("never touches another car's folder, or anything outside storage", async () => {
    await deleteCarImages(
      [
        `${BASE}/cars/car-2/theirs.jpg`, // another car's photo, stored on this one before edits were checked
        `${BASE}/cars/car-1/../car-2/theirs.jpg`,
        "https://elsewhere.example/x.jpg",
        `${BASE}/cars/car-1/mine.jpg`,
      ],
      "car-1"
    );

    expect(remove).toHaveBeenCalledWith(["cars/car-1/mine.jpg"]);
  });

  it("calls storage not at all when nothing is this car's", async () => {
    await deleteCarImages([`${BASE}/cars/car-2/theirs.jpg`], "car-1");
    expect(remove).not.toHaveBeenCalled();
  });

  it("reports a storage failure to its caller", async () => {
    remove.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(deleteCarImages([`${BASE}/cars/car-1/mine.jpg`], "car-1")).rejects.toThrow("denied");
  });
});
