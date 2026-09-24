import { describe, it, expect } from "vitest";
import {
  applyTranslation,
  sourceText,
  translationSource,
  type BilingualListing,
} from "@/lib/services/car/bilingual";

const english: BilingualListing = {
  title: "Toyota Corolla 2020",
  description: "Well kept, single owner.",
  features: ["Sunroof"],
};

const arabic: BilingualListing = {
  title: "Toyota Corolla 2020",
  description: "",
  features: [],
  titleAr: "تويوتا كورولا ٢٠٢٠",
  descriptionAr: "بحالة ممتازة، مالك واحد.",
  featuresAr: ["فتحة سقف"],
};

const both: BilingualListing = { ...english, ...arabic, description: english.description, features: english.features };

describe("translationSource", () => {
  it("fills Arabic for a listing written only in English", () => {
    expect(translationSource(english, "en")).toBe("en");
    // Also when nothing was edited: an older English-only car saved from the
    // Arabic dashboard gets its Arabic written.
    expect(translationSource(english, null)).toBe("en");
  });

  it("fills English for a listing written only in Arabic", () => {
    expect(translationSource(arabic, "ar")).toBe("ar");
  });

  it("does not spend a request on an untouched listing that has both", () => {
    // The AI photo draft: both languages, nothing edited.
    expect(translationSource(both, null)).toBeNull();
  });

  it("re-translates from the side the dealer edited, even when both exist", () => {
    // The other side is stale now.
    expect(translationSource(both, "ar")).toBe("ar");
    expect(translationSource(both, "en")).toBe("en");
  });

  it("ignores an edit that left the edited side empty", () => {
    // Nothing to translate from; the untouched side is not overwritten.
    expect(translationSource({ ...english, descriptionAr: "", featuresAr: [] }, "ar")).toBe("en");
  });

  it("treats whitespace-only fields as empty", () => {
    expect(translationSource({ ...english, descriptionAr: "  ", featuresAr: [" "] }, null)).toBe("en");
  });

  it("has nothing to do for a listing with no text in either language", () => {
    expect(translationSource({ title: "Kia Rio 2019" }, null)).toBeNull();
  });
});

describe("sourceText", () => {
  it("sends the Arabic title when there is one, the English one otherwise", () => {
    expect(sourceText(arabic, "ar").title).toBe("تويوتا كورولا ٢٠٢٠");
    expect(sourceText({ ...arabic, titleAr: null }, "ar").title).toBe("Toyota Corolla 2020");
  });
});

describe("applyTranslation", () => {
  const toArabic = { title: "عنوان", description: "وصف جديد", features: ["ميزة"] };
  const toEnglish = { title: "Translated title", description: "New description.", features: ["Feature"] };

  it("writes every Arabic field", () => {
    expect(applyTranslation(english, "ar", toArabic, false)).toMatchObject({
      titleAr: "عنوان",
      descriptionAr: "وصف جديد",
      featuresAr: ["ميزة"],
    });
  });

  it("never replaces the generated English title", () => {
    const result = applyTranslation(arabic, "en", toEnglish, true);
    expect(result.title).toBe("Toyota Corolla 2020");
    expect(result.description).toBe("New description.");
    // descriptionEn mirrors description, as the form sets it.
    expect(result.descriptionEn).toBe("New description.");
    expect(result.features).toEqual(["Feature"]);
  });

  it("only fills empty fields when the source was not edited", () => {
    // An Arabic title the dealer or the photo extraction wrote survives.
    const partial = { ...english, titleAr: "عنوان المعرض" };
    expect(applyTranslation(partial, "ar", toArabic, false).titleAr).toBe("عنوان المعرض");
  });

  it("overwrites every target field when the source was edited", () => {
    expect(applyTranslation(both, "en", toEnglish, true).description).toBe("New description.");
  });
});
