import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const findCarById = vi.hoisted(() => vi.fn());
const updateCarImageAlts = vi.hoisted(() => vi.fn());
const describeCarImages = vi.hoisted(() => vi.fn());

vi.mock("@/lib/repositories/car", () => ({ findCarById, updateCarImageAlts }));
vi.mock("@/lib/services/ai/describeCarImages", () => ({ describeCarImages }));

import {
  mergeImageAlts,
  refreshImageAlts,
  undescribedImages,
} from "@/lib/services/car/image-alts";

const BASE = "https://proj.supabase.co";
const img = (name: string) => `${BASE}/storage/v1/object/public/car-images/car-1/${name}.jpg`;
const alt = (text: string) => ({ en: text, ar: `عربي ${text}` });
const caller = { organizationId: "org-1", userId: "u1", priority: "low" as const };

describe("mergeImageAlts", () => {
  it("keeps each description with its photo through a reorder", () => {
    const existing = { [img("a")]: alt("front"), [img("b")]: alt("rear") };
    const merged = mergeImageAlts([img("b"), img("a")], existing, {});
    expect(merged[img("a")]).toEqual(alt("front"));
    expect(merged[img("b")]).toEqual(alt("rear"));
  });

  it("drops the description of a deleted photo", () => {
    const existing = { [img("a")]: alt("front"), [img("b")]: alt("rear") };
    expect(mergeImageAlts([img("a")], existing, {})).toEqual({ [img("a")]: alt("front") });
  });

  it("adds new descriptions without touching existing ones", () => {
    const merged = mergeImageAlts(
      [img("a"), img("c")],
      { [img("a")]: alt("front") },
      { [img("c")]: alt("interior") }
    );
    expect(merged).toEqual({ [img("a")]: alt("front"), [img("c")]: alt("interior") });
  });
});

describe("undescribedImages", () => {
  it("lists only photos with no alt text, in display order", () => {
    expect(undescribedImages([img("a"), img("b"), img("c")], { [img("b")]: alt("rear") })).toEqual([
      img("a"),
      img("c"),
    ]);
  });
});

describe("refreshImageAlts", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", BASE);
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([0xff, 0xd8, 0xff]), { headers: { "content-type": "image/jpeg" } })
    );
    describeCarImages.mockImplementation(async (_car, photos: Array<{ url: string }>) =>
      Object.fromEntries(photos.map((p) => [p.url, alt("described")]))
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function car(overrides: Record<string, unknown> = {}) {
    return {
      id: "car-1",
      organizationId: "org-1",
      year: 2018,
      make: "Porsche",
      model: "Panamera",
      images: [img("a"), img("b")],
      imageAlts: null,
      ...overrides,
    };
  }

  it("describes undescribed photos and stores them", async () => {
    findCarById.mockResolvedValue(car({ imageAlts: { [img("a")]: alt("front") } }));
    await refreshImageAlts("car-1", "org-1", caller);

    // Only the photo without alt text is sent.
    expect(describeCarImages.mock.calls[0][1].map((p: { url: string }) => p.url)).toEqual([img("b")]);
    expect(updateCarImageAlts).toHaveBeenCalledWith("car-1", "org-1", {
      [img("a")]: alt("front"),
      [img("b")]: alt("described"),
    });
  });

  it("never touches another tenant's car", async () => {
    findCarById.mockResolvedValue(car({ organizationId: "org-2" }));
    await refreshImageAlts("car-1", "org-1", caller);
    expect(describeCarImages).not.toHaveBeenCalled();
    expect(updateCarImageAlts).not.toHaveBeenCalled();
  });

  it("only fetches our own storage", async () => {
    findCarById.mockResolvedValue(car({ images: ["http://169.254.169.254/latest/meta-data", img("a")] }));
    await refreshImageAlts("car-1", "org-1", caller);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(img("a"));
  });

  it("makes no call and no write when every photo is already described", async () => {
    findCarById.mockResolvedValue(car({ imageAlts: { [img("a")]: alt("x"), [img("b")]: alt("y") } }));
    await refreshImageAlts("car-1", "org-1", caller);
    expect(describeCarImages).not.toHaveBeenCalled();
    expect(updateCarImageAlts).not.toHaveBeenCalled();
  });

  it("prunes a deleted photo's alt text without calling the model", async () => {
    findCarById.mockResolvedValue(
      car({ images: [img("a")], imageAlts: { [img("a")]: alt("x"), [img("gone")]: alt("y") } })
    );
    await refreshImageAlts("car-1", "org-1", caller);
    expect(describeCarImages).not.toHaveBeenCalled();
    expect(updateCarImageAlts).toHaveBeenCalledWith("car-1", "org-1", { [img("a")]: alt("x") });
  });

  it("never throws — a failed call leaves the fallback alt text", async () => {
    findCarById.mockResolvedValue(car());
    describeCarImages.mockRejectedValue(new Error("AI busy"));
    await expect(refreshImageAlts("car-1", "org-1", caller)).resolves.toBeUndefined();
    expect(updateCarImageAlts).not.toHaveBeenCalled();
  });
});
