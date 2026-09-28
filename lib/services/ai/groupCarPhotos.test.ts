import { describe, it, expect, vi, beforeEach } from "vitest";

const generateStructured = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/client", () => ({ generateStructured }));

import { groupCarPhotos, normalizeGrouping } from "@/lib/services/ai/groupCarPhotos";
import { AI_FEATURES } from "@/lib/ai/features";
import type { PreparedImage } from "@/lib/services/ai/image";

beforeEach(() => vi.resetAllMocks());

const car = (photos: number[], readWith: number[] = [], label = "white Elantra") => ({ label, photos, readWith });

describe("normalizeGrouping", () => {
  it("keeps a sound grouping as it is", () => {
    expect(normalizeGrouping({ cars: [car([0, 1], [1]), car([2], [2], "red K5")] }, 3)).toEqual([
      { label: "white Elantra", photos: [0, 1], readWith: [1, 0] },
      { label: "red K5", photos: [2], readWith: [2] },
    ]);
  });

  it("puts each photo in one car only, the first that claimed it", () => {
    const groups = normalizeGrouping({ cars: [car([0, 1]), car([1, 2])] }, 3);
    expect(groups.map((g) => g.photos)).toEqual([[0, 1], [2]]);
  });

  it("drops photo numbers the model invented, and cars left with none", () => {
    const groups = normalizeGrouping({ cars: [car([0, 7, -1]), car([9])] }, 1);
    expect(groups.map((g) => g.photos)).toEqual([[0]]);
  });

  it("gives every photo the model left out a car of its own", () => {
    const groups = normalizeGrouping({ cars: [car([1])] }, 3);
    expect(groups.map((g) => g.photos)).toEqual([[1], [0], [2]]);
  });

  it("reads with the car's own photos only, its picks first, filled to three", () => {
    expect(normalizeGrouping({ cars: [car([0, 1, 2, 3, 4], [4, 9, 3, 2, 1])] }, 5)[0].readWith).toEqual([4, 3, 2]);
    expect(normalizeGrouping({ cars: [car([0, 1, 2, 3], [8])] }, 4)[0].readWith).toEqual([0, 1, 2]);
    // A pick of two from three once left out the boot lid that named the car.
    expect(normalizeGrouping({ cars: [car([0, 1, 2], [0, 2])] }, 3)[0].readWith).toEqual([0, 2, 1]);
  });

  it("keeps model numbers in a label, trimmed and capped", () => {
    expect(normalizeGrouping({ cars: [car([0], [0], "  grey Peugeot 3008  ")] }, 1)[0].label).toBe("grey Peugeot 3008");
    expect(normalizeGrouping({ cars: [car([0], [0], "x".repeat(200))] }, 1)[0].label).toHaveLength(80);
  });
});

describe("groupCarPhotos", () => {
  const image = (n: number): PreparedImage => ({ part: { text: `img${n}` } as never, bytes: Buffer.from([n]) });

  it("asks nothing for a single photo", async () => {
    expect(await groupCarPhotos([image(0)], { organizationId: "o", userId: "u" })).toEqual([
      { label: "", photos: [0], readWith: [0] },
    ]);
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("sorts a batch in one fast-vision call, metered as grouping, never as a listing", async () => {
    generateStructured.mockResolvedValue({ cars: [car([0, 1], [0])] });
    await groupCarPhotos([image(0), image(1)], { organizationId: "o", userId: "u" });
    const input = generateStructured.mock.calls[0][0];
    expect(input.feature).toBe(AI_FEATURES.carPhotoGrouping);
    expect(input.task).toBe("visionFast");
    expect(input.parts).toHaveLength(3);
  });
});
