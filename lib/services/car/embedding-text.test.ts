import { describe, it, expect } from "vitest";
import { carEmbeddingText, embeddingHash, type CarForEmbedding } from "@/lib/services/car/embedding-text";

const car: CarForEmbedding = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  bodyType: "Sedan",
  fuelType: "Gasoline",
  title: null,
  titleEn: "Toyota Corolla 2020",
  titleAr: "تويوتا كورولا ٢٠٢٠",
  description: null,
  descriptionEn: "Single owner, full service history.",
  descriptionAr: "مالك واحد، سجل صيانة كامل.",
  features: ["Rear camera", "Cruise control"],
  featuresAr: ["كاميرا خلفية"],
};

describe("carEmbeddingText", () => {
  it("says what the car is and what the dealer wrote, in both languages", () => {
    expect(carEmbeddingText(car).split("\n")).toEqual([
      "2020 Toyota Corolla, Sedan, Gasoline",
      "Single owner, full service history.",
      "مالك واحد، سجل صيانة كامل.",
      "Rear camera, Cruise control",
      "كاميرا خلفية",
    ]);
  });

  it("leaves out what the car does not have, and never the word for nothing", () => {
    const text = carEmbeddingText({ ...car, descriptionAr: null, featuresAr: [], features: [] });
    expect(text).not.toMatch(/undefined|null/);
    expect(text.split("\n")).toHaveLength(2);
  });

  it("falls back to the original description when there is no English copy", () => {
    expect(carEmbeddingText({ ...car, descriptionEn: null, description: "One owner." })).toContain("One owner.");
  });
});

describe("embeddingHash", () => {
  it("changes with the text or the model, and only then", () => {
    expect(embeddingHash("a", "m1")).toBe(embeddingHash("a", "m1"));
    expect(embeddingHash("a", "m1")).not.toBe(embeddingHash("b", "m1"));
    expect(embeddingHash("a", "m1")).not.toBe(embeddingHash("a", "m2"));
  });
});
