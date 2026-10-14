import { describe, expect, it } from "vitest";
import { localeOf, pathnameWithoutLocale } from "./locale-path";

describe("pathnameWithoutLocale", () => {
  it("strips a leading locale segment", () => {
    expect(pathnameWithoutLocale("/en/cars")).toBe("/cars");
    expect(pathnameWithoutLocale("/ar/onboarding/success")).toBe(
      "/onboarding/success"
    );
  });

  it("maps a bare locale root to /", () => {
    expect(pathnameWithoutLocale("/en")).toBe("/");
    expect(pathnameWithoutLocale("/ar")).toBe("/");
  });

  it("leaves unprefixed paths alone", () => {
    expect(pathnameWithoutLocale("/cars")).toBe("/cars");
    expect(pathnameWithoutLocale("/api/webhooks/clerk")).toBe(
      "/api/webhooks/clerk"
    );
  });

  it("does not strip a path segment that merely starts with a locale", () => {
    // "/enterprise" begins with "en" — without the (?=/|$) boundary this
    // returns "terprise", and the caller silently routes to a path that has
    // never existed.
    expect(pathnameWithoutLocale("/enterprise")).toBe("/enterprise");
    expect(pathnameWithoutLocale("/architecture")).toBe("/architecture");
  });
});

describe("localeOf", () => {
  it("reads the prefix when present", () => {
    expect(localeOf("/ar/cars")).toBe("ar");
    expect(localeOf("/en")).toBe("en");
  });

  it("falls back to the default locale when absent", () => {
    expect(localeOf("/cars")).toBe("en");
  });

  it("does not read a locale out of a longer word", () => {
    expect(localeOf("/enterprise")).toBe("en"); // the default, not a match
    expect(localeOf("/arabica/cars")).toBe("en");
  });
});
