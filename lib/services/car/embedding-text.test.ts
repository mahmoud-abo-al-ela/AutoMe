import { describe, it, expect } from "vitest";
import { carEmbeddingText, embeddingHash, type CarForEmbedding } from "@/lib/services/car/embedding-text";

const car: CarForEmbedding = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  bodyType: "Sedan",
  fuelType: "Gasoline",
  transmission: "Automatic",
  color: "White",
  seats: 5,
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
  it("says what the car is in both languages, with the dealer's own words", () => {
    const text = carEmbeddingText(car);
    expect(text).toContain("2020 Toyota Corolla, Sedan, Gasoline, Automatic, White, 5 seats");
    expect(text).toContain("تويوتا Corolla، سيدان، بنزين، أوتوماتيك، أبيض");
    expect(text).toContain("Single owner, full service history.");
    expect(text).toContain("مالك واحد، سجل صيانة كامل.");
    expect(text).toContain("Rear camera, Cruise control");
  });

  it("leaves out the price and anything the car does not have", () => {
    const text = carEmbeddingText({ ...car, titleAr: null, descriptionAr: null, featuresAr: [], seats: null });
    expect(text).not.toMatch(/undefined|null|seats/);
    expect(text.split("\n")).toHaveLength(5);
  });

  it("falls back to the original title and description when there is no English copy", () => {
    const text = carEmbeddingText({ ...car, titleEn: null, title: "Clean Corolla", descriptionEn: null, description: "One owner." });
    expect(text).toContain("Clean Corolla");
    expect(text).toContain("One owner.");
  });
});

describe("embeddingHash", () => {
  it("changes with the text or the model, and only then", () => {
    expect(embeddingHash("a", "m1")).toBe(embeddingHash("a", "m1"));
    expect(embeddingHash("a", "m1")).not.toBe(embeddingHash("b", "m1"));
    expect(embeddingHash("a", "m1")).not.toBe(embeddingHash("a", "m2"));
  });
});
