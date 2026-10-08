import { describe, it, expect } from "vitest";
import { dealershipTranslationPlan, resolveDealershipText } from "./dealership-text";

const EN = "Quality used cars with a 12-month warranty.";
const AR = "سيارات مستعملة مضمونة مع ضمان لمدة ١٢ شهرًا.";
const ADDRESS_EN = "El Bahr Street, Tanta";
const ADDRESS_AR = "شارع البحر، طنطا";

describe("resolveDealershipText", () => {
  it("shows the dealer's own text to readers of its language", () => {
    expect(resolveDealershipText({ description: EN }, "description", "en")).toEqual({ text: EN, locale: "en", fellBack: false });
    expect(resolveDealershipText({ description: AR }, "description", "ar")).toEqual({ text: AR, locale: "ar", fellBack: false });
  });

  it("shows the translation to readers of the other language", () => {
    const org = { description: EN, descriptionEn: EN, descriptionAr: AR };
    expect(resolveDealershipText(org, "description", "ar")).toEqual({ text: AR, locale: "ar", fellBack: false });
  });

  it("falls back to the dealer's text, marked, before a translation exists", () => {
    expect(resolveDealershipText({ address: ADDRESS_EN }, "address", "ar")).toEqual({
      text: ADDRESS_EN,
      locale: "en",
      fellBack: true,
    });
  });

  it("never shows a translation of text the dealer has since replaced", () => {
    const edited = { address: "Galaa Street, Tanta", addressEn: ADDRESS_EN, addressAr: ADDRESS_AR };
    expect(resolveDealershipText(edited, "address", "ar")).toEqual({
      text: "Galaa Street, Tanta",
      locale: "en",
      fellBack: true,
    });
  });

  it("follows the dealer switching language", () => {
    const switched = { description: AR, descriptionEn: EN, descriptionAr: "ترجمة قديمة" };
    expect(resolveDealershipText(switched, "description", "ar")?.text).toBe(AR);
    expect(resolveDealershipText(switched, "description", "en")).toEqual({ text: AR, locale: "ar", fellBack: true });
  });

  it("judges each field on its own", () => {
    const org = { description: AR, address: ADDRESS_EN, addressEn: ADDRESS_EN, addressAr: ADDRESS_AR };
    expect(resolveDealershipText(org, "address", "ar")?.text).toBe(ADDRESS_AR);
    expect(resolveDealershipText(org, "description", "ar")?.text).toBe(AR);
  });

  it("is null with no text, whatever the columns hold", () => {
    expect(resolveDealershipText({ description: " ", descriptionEn: EN, descriptionAr: AR }, "description", "en")).toBeNull();
  });
});

describe("dealershipTranslationPlan", () => {
  it("lists each field still to translate, in its own direction", () => {
    expect(dealershipTranslationPlan({ description: AR, address: ADDRESS_EN })).toEqual([
      { field: "description", source: AR, from: "ar", to: "en" },
      { field: "address", source: ADDRESS_EN, from: "en", to: "ar" },
    ]);
  });

  it("skips fields already in step", () => {
    const org = { description: EN, descriptionEn: EN, descriptionAr: AR, address: ADDRESS_EN };
    expect(dealershipTranslationPlan(org).map((item) => item.field)).toEqual(["address"]);
  });

  it("translates again after an edit", () => {
    const edited = { description: "Now open on Fridays.", descriptionEn: EN, descriptionAr: AR };
    expect(dealershipTranslationPlan(edited)).toMatchObject([{ field: "description", from: "en", to: "ar" }]);
  });

  it("sends nothing without text or without letters", () => {
    expect(dealershipTranslationPlan({ description: null, address: "15" })).toEqual([]);
  });
});
