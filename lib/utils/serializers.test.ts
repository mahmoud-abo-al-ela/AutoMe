import { describe, it, expect } from "vitest";
import { serializeCar } from "./serializers";

const row = {
  id: "c1",
  organizationId: "o1",
  make: "Kia",
  model: "Sportage",
  year: 2019,
  price: "1350000",
  images: ["https://img.test/front.jpg", "https://img.test/side.jpg"],
  imageAlts: {
    "https://img.test/side.jpg": { en: "Side view", ar: "منظر جانبي" },
    "https://img.test/front.jpg": { en: "A silver Kia Sportage from the front", ar: "كيا سبورتاج فضية من الأمام" },
  },
  createdAt: new Date("2026-10-01T00:00:00Z"),
  updatedAt: new Date("2026-10-01T00:00:00Z"),
};

type Row = NonNullable<Parameters<typeof serializeCar>[0]>;
const car = (overrides: Record<string, unknown> = {}) => ({ ...row, ...overrides }) as unknown as Row;

describe("serializeCar coverAlt", () => {
  it("is the cover photo's description in both languages", () => {
    expect(serializeCar(car()).coverAlt).toEqual({
      en: "A silver Kia Sportage from the front",
      ar: "كيا سبورتاج فضية من الأمام",
    });
  });

  it("is null before the cover photo is described", () => {
    expect(serializeCar(car({ imageAlts: null })).coverAlt).toBeNull();
    expect(serializeCar(car({ images: [] })).coverAlt).toBeNull();
  });
});
