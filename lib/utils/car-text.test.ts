import { describe, it, expect } from "vitest";
import { resolveCarTitle, resolveCarDescription } from "@/lib/utils/car-text";

const bilingual = {
  title: "Legacy title",
  titleEn: "Porsche Panamera Turbo 2018",
  titleAr: "بورشه باناميرا توربو ٢٠١٨",
  description: "Legacy description",
  descriptionEn: "Well kept, single owner.",
  descriptionAr: "بحالة ممتازة، مالك واحد.",
};

describe("resolveCarTitle", () => {
  it("gives each locale its own language", () => {
    expect(resolveCarTitle(bilingual, "ar")?.text).toBe("بورشه باناميرا توربو ٢٠١٨");
    expect(resolveCarTitle(bilingual, "en")?.text).toBe("Porsche Panamera Turbo 2018");
  });

  it("does not flag a fallback when the wanted language is present", () => {
    expect(resolveCarTitle(bilingual, "ar")?.fellBack).toBe(false);
    expect(resolveCarTitle(bilingual, "en")?.fellBack).toBe(false);
  });

  it("shows English to an Arabic reader rather than nothing, and says so", () => {
    const car = { ...bilingual, titleAr: null };
    const resolved = resolveCarTitle(car, "ar");

    // An empty listing is worse than an untranslated one.
    expect(resolved?.text).toBe("Porsche Panamera Turbo 2018");
    expect(resolved?.fellBack).toBe(true);
  });

  it("treats the legacy column as the English text, not as a fallback", () => {
    // `title` predates the bilingual columns and has always held English.
    const legacyOnly = { title: "Legacy title" };

    expect(resolveCarTitle(legacyOnly, "en")).toEqual({
      text: "Legacy title",
      locale: "en",
      fellBack: false,
    });
  });

  it("is a fallback when an Arabic reader gets the legacy column", () => {
    const legacyOnly = { title: "Legacy title" };

    expect(resolveCarTitle(legacyOnly, "ar")).toEqual({
      text: "Legacy title",
      locale: "en",
      fellBack: true,
    });
  });

  it("prefers the bilingual column over the legacy one", () => {
    expect(resolveCarTitle(bilingual, "en")?.text).not.toBe("Legacy title");
  });

  it("returns null when the car has no stored title at all", () => {
    // The caller falls back to a generated "2020 Toyota Corolla", which needs
    // locale-aware number formatting and so stays in the component.
    expect(resolveCarTitle({}, "en")).toBeNull();
    expect(resolveCarTitle({}, "ar")).toBeNull();
  });

  it.each(["", "   "])("treats %p as absent", (blank) => {
    // A blank column is as useless as a missing one, and the model can emit "".
    expect(resolveCarTitle({ titleAr: blank, titleEn: "English" }, "ar")).toEqual({
      text: "English",
      locale: "en",
      fellBack: true,
    });
  });

  it("trims what it returns", () => {
    expect(resolveCarTitle({ titleEn: "  padded  " }, "en")?.text).toBe("padded");
  });
});

describe("resolveCarDescription", () => {
  it("gives each locale its own language", () => {
    expect(resolveCarDescription(bilingual, "ar")?.text).toBe("بحالة ممتازة، مالك واحد.");
    expect(resolveCarDescription(bilingual, "en")?.text).toBe("Well kept, single owner.");
  });

  it("falls back across languages and reports it", () => {
    const car = { ...bilingual, descriptionAr: null, descriptionEn: null, description: null };
    expect(resolveCarDescription(car, "ar")).toBeNull();

    const englishOnly = { descriptionEn: "Only English here." };
    expect(resolveCarDescription(englishOnly, "ar")).toEqual({
      text: "Only English here.",
      locale: "en",
      fellBack: true,
    });
  });

  it("returns null when there is no description in any language", () => {
    expect(resolveCarDescription({}, "ar")).toBeNull();
  });
});

describe("the language the text is actually in", () => {
  it("reports the wanted language when nothing fell back", () => {
    expect(resolveCarTitle(bilingual, "ar")?.locale).toBe("ar");
    expect(resolveCarTitle(bilingual, "en")?.locale).toBe("en");
  });

  it("reports the language actually returned, not the one asked for", () => {
    // The caller sets `dir` from this. English prose in an RTL page without
    // dir="ltr" renders with its punctuation displaced, which reads as a bug
    // rather than as a missing translation.
    const noArabic = { titleEn: "Porsche Panamera Turbo 2018" };

    expect(resolveCarTitle(noArabic, "ar")).toEqual({
      text: "Porsche Panamera Turbo 2018",
      locale: "en",
      fellBack: true,
    });
  });

  it("marks legacy text as English whichever locale asked", () => {
    expect(resolveCarDescription({ description: "Legacy" }, "ar")?.locale).toBe("en");
    expect(resolveCarDescription({ description: "Legacy" }, "en")?.locale).toBe("en");
  });
});
