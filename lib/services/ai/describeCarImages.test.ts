import { describe, it, expect, vi, beforeEach } from "vitest";

const generateStructured = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/client", () => ({ generateStructured }));

import { describeCarImages } from "@/lib/services/ai/describeCarImages";
import { AI_FEATURES } from "@/lib/ai/features";

const photo = (url: string, byte: number) => ({
  url,
  bytes: Buffer.from([0xff, 0xd8, 0xff, byte]),
  mimeType: "image/jpeg",
});
const car = { year: 2018, make: "Porsche", model: "Panamera" };
const ctx = { organizationId: "org-1", userId: "u1" };

beforeEach(() => vi.clearAllMocks());

describe("describeCarImages", () => {
  it("attaches each description to the photo at its index", async () => {
    generateStructured.mockResolvedValue({
      images: [
        { index: 1, en: " Rear view ", ar: "منظر خلفي" },
        { index: 0, en: "Front view", ar: "منظر أمامي" },
      ],
    });

    const alts = await describeCarImages(car, [photo("a", 1), photo("b", 2)], ctx);
    expect(alts).toEqual({
      a: { en: "Front view", ar: "منظر أمامي" },
      b: { en: "Rear view", ar: "منظر خلفي" },
    });
  });

  it("ignores an index that has no photo", async () => {
    generateStructured.mockResolvedValue({ images: [{ index: 7, en: "x", ar: "س" }] });
    expect(await describeCarImages(car, [photo("a", 1)], ctx)).toEqual({});
  });

  it("makes no call for no photos", async () => {
    expect(await describeCarImages(car, [], ctx)).toEqual({});
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("meters under its own feature, on the light model chain", async () => {
    generateStructured.mockResolvedValue({ images: [] });
    await describeCarImages(car, [photo("a", 1)], ctx);
    expect(generateStructured.mock.calls[0][0]).toMatchObject({
      feature: AI_FEATURES.carImageAltText,
      task: "visionFast",
    });
  });

  it("does not serve one car's descriptions for the same photos under another name", async () => {
    // The prompt names the car, so a corrected make must be a cache miss.
    generateStructured.mockResolvedValue({ images: [] });
    await describeCarImages(car, [photo("a", 1)], ctx);
    await describeCarImages({ ...car, make: "Audi" }, [photo("a", 1)], ctx);
    const [first, second] = generateStructured.mock.calls.map((c) => c[0].cacheBytes);
    expect(first).not.toBe(second);
  });
});
