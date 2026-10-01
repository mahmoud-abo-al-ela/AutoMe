import { describe, it, expect } from "vitest";
import { preferredLocale, localeToSuggest } from "@/lib/utils/locale-suggestion";

describe("preferredLocale", () => {
  it("matches a region-qualified tag on its language", () => {
    expect(preferredLocale("ar-EG,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(preferredLocale("en-GB")).toBe("en");
  });

  it("ranks by q-value, not by position", () => {
    expect(preferredLocale("en;q=0.5, ar;q=0.9")).toBe("ar");
  });

  it("breaks q-value ties by order of appearance", () => {
    expect(preferredLocale("ar, en")).toBe("ar");
    expect(preferredLocale("en, ar")).toBe("en");
  });

  it("skips unsupported languages to reach a supported one", () => {
    expect(preferredLocale("fr-FR,fr;q=0.9,ar;q=0.8")).toBe("ar");
  });

  it("treats q=0 as a refusal, not a preference", () => {
    expect(preferredLocale("ar;q=0, en;q=0.1")).toBe("en");
  });

  it("returns null when nothing supported is asked for", () => {
    expect(preferredLocale("fr, de;q=0.8")).toBeNull();
    expect(preferredLocale("*")).toBeNull();
    expect(preferredLocale("")).toBeNull();
    expect(preferredLocale(null)).toBeNull();
  });

  it("survives a malformed header", () => {
    expect(preferredLocale(" , ;q=abc, AR ;q=1")).toBe("ar");
  });
});

describe("localeToSuggest", () => {
  it("offers Arabic to an Arabic browser on an English page", () => {
    expect(localeToSuggest("en", "ar-EG,ar;q=0.9", undefined)).toBe("ar");
  });

  it("offers English to an English browser on an Arabic page", () => {
    expect(localeToSuggest("ar", "en-US,en;q=0.9", undefined)).toBe("en");
  });

  it("stays quiet when the page is already in the browser's language", () => {
    expect(localeToSuggest("ar", "ar-EG", undefined)).toBeNull();
  });

  it("stays quiet once the reader has chosen, whichever way", () => {
    // Dismissing on /en records "en"; that must not re-offer Arabic later.
    expect(localeToSuggest("en", "ar-EG", "en")).toBeNull();
    expect(localeToSuggest("en", "ar-EG", "ar")).toBeNull();
  });

  it("ignores a cookie value that is not a locale", () => {
    expect(localeToSuggest("en", "ar-EG", "fr")).toBe("ar");
  });

  it("stays quiet without a header — crawlers usually send none", () => {
    expect(localeToSuggest("ar", undefined, undefined)).toBeNull();
  });
});
