import { describe, it, expect } from "vitest";
import {
  containsArabic,
  isPredominantlyArabic,
  containsArabicDigits,
  containsWesternDigits,
  isAllowlisted,
  isPlausibleEgpCarPrice,
  isPlausibleKilometres,
  firstLeak,
  listingText,
  egyptianDialectWord,
} from "@/lib/ai/evaluation/assertions";

/**
 * The evaluation suite only runs against a real API key, so these assertions
 * would otherwise never be exercised in CI. An assertion that is wrong is worse
 * than no assertion: it reports a regressed feature as healthy.
 */

describe("isPredominantlyArabic", () => {
  it("accepts a real Arabic listing sentence", () => {
    expect(
      isPredominantlyArabic("سيارة بورشه باناميرا توربو موديل ٢٠١٨ بحالة ممتازة")
    ).toBe(true);
  });

  it("rejects English", () => {
    expect(isPredominantlyArabic("Well kept, single owner, full service.")).toBe(
      false
    );
  });

  it("rejects an English sentence wearing one Arabic word", () => {
    // The actual failure mode: the model ignores the language instruction and
    // answers in English with the marque transliterated. `containsArabic`
    // alone would wave this through.
    const sneaky = "This بورشه is a well kept single owner car with full history.";

    expect(containsArabic(sneaky)).toBe(true);
    expect(isPredominantlyArabic(sneaky)).toBe(false);
  });

  it("accepts Arabic carrying a Latin marque, which is correct", () => {
    expect(isPredominantlyArabic("سيارة Porsche Panamera بحالة ممتازة جداً")).toBe(
      true
    );
  });

  it("rejects an empty string rather than treating it as Arabic", () => {
    expect(isPredominantlyArabic("")).toBe(false);
  });
});

describe("digit detection", () => {
  it("tells the two numeral systems apart", () => {
    expect(containsArabicDigits("موديل ٢٠١٨")).toBe(true);
    expect(containsArabicDigits("model 2018")).toBe(false);
    expect(containsWesternDigits("model 2018")).toBe(true);
    expect(containsWesternDigits("موديل ٢٠١٨")).toBe(false);
  });

  it("recognises the extended Arabic-Indic set too", () => {
    expect(containsArabicDigits("۲۰۱۸")).toBe(true);
  });
});

describe("isAllowlisted", () => {
  it("accepts the canonical values", () => {
    expect(isAllowlisted("bodyType", "Sedan")).toBe(true);
    expect(isAllowlisted("fuelType", "Gasoline")).toBe(true);
    expect(isAllowlisted("transmission", "Automatic")).toBe(true);
  });

  it("rejects the verbose form the schema now makes unrepresentable", () => {
    expect(isAllowlisted("bodyType", "Sport Utility Vehicle (SUV)")).toBe(false);
  });

  it("is case sensitive, because the filters compare by equality", () => {
    expect(isAllowlisted("bodyType", "sedan")).toBe(false);
  });
});

describe("isPlausibleEgpCarPrice", () => {
  it("accepts a normal Egyptian listing price", () => {
    expect(isPlausibleEgpCarPrice(850_000)).toBe(true);
    expect(isPlausibleEgpCarPrice(8_500_000)).toBe(true);
  });

  it("rejects a figure that looks like a USD conversion", () => {
    // 8,500,000 EGP converted to USD is roughly 170,000 — but a cheaper car
    // converts into the tens of thousands, which is the shape this catches.
    expect(isPlausibleEgpCarPrice(17_000)).toBe(false);
  });

  it("rejects zero and negatives", () => {
    expect(isPlausibleEgpCarPrice(0)).toBe(false);
    expect(isPlausibleEgpCarPrice(-1)).toBe(false);
  });
});

describe("isPlausibleKilometres", () => {
  it("accepts a normal odometer reading", () => {
    expect(isPlausibleKilometres(62_000)).toBe(true);
    expect(isPlausibleKilometres(0)).toBe(true);
  });

  it("rejects a price that arrived in the mileage field", () => {
    expect(isPlausibleKilometres(8_500_000)).toBe(false);
  });
});

describe("firstLeak", () => {
  it("finds plate text however it is spaced", () => {
    expect(firstLeak("لوحة سطع ١٢٣٤", ["س ط ع"])).toBe("س ط ع");
    expect(firstLeak("plate CVC 911", ["CVC"])).toBe("CVC");
  });

  it("returns null when nothing leaked", () => {
    expect(firstLeak("Porsche Panamera Turbo 2018", ["CVC", "١٢٣٤"])).toBeNull();
  });
});

describe("listingText", () => {
  it("covers every field a buyer reads, in both languages", () => {
    const text = listingText({
      titleEn: "a",
      titleAr: "b",
      descriptionEn: "c",
      descriptionAr: "d",
      featuresEn: ["e"],
      featuresAr: ["f"],
    });
    for (const part of ["a", "b", "c", "d", "e", "f"]) expect(text).toContain(part);
  });
});

describe("egyptianDialectWord", () => {
  it("finds a colloquial word, with or without a conjunction in front", () => {
    expect(egyptianDialectWord("مفيش حوادث مذكورة")).toBe("مفيش");
    expect(egyptianDialectWord("السيارة متاحة ومش مستعملة كتير")).toBe("مش");
    expect(egyptianDialectWord("العربية دي بكام؟")).toBe("العربية دي");
  });

  it("passes plain Modern Standard Arabic, including words that only contain a marker", () => {
    expect(egyptianDialectWord("لا يوجد في الإعلان ما يشير إلى حوادث، ويمكنك سؤال التاجر.")).toBeNull();
    // مشروع contains مش, ديزل contains دي, الذي is not اللي.
    expect(egyptianDialectWord("محرك ديزل ضمن مشروع التاجر الذي يعمل الآن")).toBeNull();
    expect(egyptianDialectWord("الإعلان مكتوب باللغة العربية")).toBeNull();
  });
});
