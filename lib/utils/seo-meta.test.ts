import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  localeAlternates,
  openGraphLocale,
  openGraphAlternateLocales,
  truncateForMeta,
  META_DESCRIPTION_LIMIT,
} from "@/lib/utils/seo-meta";

const original = process.env.NEXT_PUBLIC_APP_URL;

beforeAll(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://autome.test";
});

afterAll(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = original;
});

describe("localeAlternates", () => {
  it("points the canonical at the locale being rendered", () => {
    expect(localeAlternates("/cars/abc", "ar").canonical).toBe(
      "https://autome.test/ar/cars/abc"
    );
    expect(localeAlternates("/cars/abc", "en").canonical).toBe(
      "https://autome.test/en/cars/abc"
    );
  });

  it("lists every locale, region-qualified for Egypt", () => {
    const { languages } = localeAlternates("/cars/abc", "en");

    expect(languages["en-EG"]).toBe("https://autome.test/en/cars/abc");
    expect(languages["ar-EG"]).toBe("https://autome.test/ar/cars/abc");
  });

  it("gives x-default a prefixed URL, because no unprefixed one exists", () => {
    // localePrefix is "always", so /cars/abc is not a real page.
    const { languages } = localeAlternates("/cars/abc", "ar");

    expect(languages["x-default"]).toBe("https://autome.test/en/cars/abc");
    expect(languages["x-default"]).not.toBe("https://autome.test/cars/abc");
  });

  it("is identical whichever locale renders it, apart from the canonical", () => {
    // Every locale must advertise the same set, or the pages disagree about
    // which is canonical and Google picks for itself.
    expect(localeAlternates("/cars/abc", "ar").languages).toEqual(
      localeAlternates("/cars/abc", "en").languages
    );
  });

  it("normalises a missing leading slash and a trailing base slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://autome.test/";
    expect(localeAlternates("cars/abc", "en").canonical).toBe(
      "https://autome.test/en/cars/abc"
    );
    process.env.NEXT_PUBLIC_APP_URL = "https://autome.test";
  });
});

describe("open graph locales", () => {
  it("uses ll_CC, not the hreflang tag", () => {
    // og:locale and hreflang disagree on separator; emitting "ar-EG" here is a
    // silently ignored tag.
    expect(openGraphLocale("ar")).toBe("ar_EG");
    expect(openGraphLocale("en")).toBe("en_EG");
  });

  it("lists the other locales as alternates, never itself", () => {
    expect(openGraphAlternateLocales("ar")).toEqual(["en_EG"]);
    expect(openGraphAlternateLocales("en")).toEqual(["ar_EG"]);
  });
});

describe("truncateForMeta", () => {
  it("leaves a short description alone", () => {
    expect(truncateForMeta("Well kept, single owner.")).toBe(
      "Well kept, single owner."
    );
  });

  it("adds no ellipsis when nothing was removed", () => {
    expect(truncateForMeta("Short.")).not.toContain("…");
  });

  it("collapses the whitespace a textarea leaves behind", () => {
    expect(truncateForMeta("Well kept.\n\n  Single owner.")).toBe(
      "Well kept. Single owner."
    );
  });

  it("cuts on a word boundary, not mid-word", () => {
    const text = "condition ".repeat(40);
    const result = truncateForMeta(text);

    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_LIMIT + 1);
    expect(result.endsWith("…")).toBe(true);
    // A cut mid-word would leave a fragment like "conditio…".
    expect(result.replace("…", "").trim().split(" ").pop()).toBe("condition");
  });

  it("still truncates text with no spaces to cut on", () => {
    const result = truncateForMeta("x".repeat(400));

    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_LIMIT + 1);
    expect(result.endsWith("…")).toBe(true);
  });

  it("truncates Arabic the same way", () => {
    const arabic = "سيارة نظيفة جداً بحالة ممتازة وصيانة كاملة ".repeat(8);
    const result = truncateForMeta(arabic);

    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_LIMIT + 1);
    expect(result.endsWith("…")).toBe(true);
  });
});
