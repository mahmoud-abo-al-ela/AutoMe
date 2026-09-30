import { describe, it, expect } from "vitest";
import { parseImageAlts } from "@/lib/utils/image-alts";
import { serializeCarWithImages } from "@/lib/utils/serializers";

describe("parseImageAlts", () => {
  it.each([null, undefined, "text", 3, ["a"]])("treats %s as no alt text", (value) => {
    expect(parseImageAlts(value)).toEqual({});
  });

  it("keeps only entries with both languages", () => {
    expect(
      parseImageAlts({ a: { en: "Front", ar: "أمامي" }, b: { en: "Rear" }, c: null })
    ).toEqual({ a: { en: "Front", ar: "أمامي" } });
  });
});

describe("serializeCarWithImages", () => {
  const row = {
    id: "car-1",
    make: "Porsche",
    model: "Panamera",
    price: 8500000,
    images: ["u1", "u2"],
    imageAlts: { u2: { en: "Rear view", ar: "منظر خلفي" } },
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as unknown as Parameters<typeof serializeCarWithImages>[0];

  it("carries each image's description, and null where there is none", () => {
    // The row is typed loosely, which selects the nullable overload.
    const { images } = serializeCarWithImages(row)!;
    expect(images[0]).toMatchObject({ url: "u1", alt: "Porsche Panamera", description: null });
    expect(images[1]).toMatchObject({ url: "u2", description: { en: "Rear view", ar: "منظر خلفي" } });
  });
});
