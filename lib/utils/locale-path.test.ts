import { describe, expect, it } from "vitest";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { localized, localeOf, pathnameWithoutLocale } from "./locale-path";

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

describe("localized route matchers", () => {
  const req = (path: string) =>
    new NextRequest(new URL(`https://autome.test${path}`));

  it("matches both the prefixed and unprefixed form", () => {
    const isSuperAdmin = createRouteMatcher(localized(["/super-admin(.*)"]));

    expect(isSuperAdmin(req("/super-admin"))).toBe(true);
    expect(isSuperAdmin(req("/en/super-admin"))).toBe(true);
    expect(isSuperAdmin(req("/ar/super-admin/users"))).toBe(true);
  });

  it("still refuses unrelated routes", () => {
    const isSuperAdmin = createRouteMatcher(localized(["/super-admin(.*)"]));

    expect(isSuperAdmin(req("/cars"))).toBe(false);
    expect(isSuperAdmin(req("/en/cars"))).toBe(false);
    // Pinning pre-existing behaviour rather than endorsing it: the `(.*)` in
    // these patterns is greedy enough to match a sibling path that merely
    // starts with the same string. It errs toward over-protecting, so it is not
    // a hole — but it is worth knowing before someone tightens the patterns.
    expect(isSuperAdmin(req("/en/super-admin-impostor"))).toBe(true);
  });

  it("covers every protected route family in both locales", () => {
    const isProtected = createRouteMatcher(
      localized(["/admin(.*)", "/saved-cars(.*)", "/reservations(.*)"])
    );

    for (const path of ["/admin", "/saved-cars", "/reservations"]) {
      expect(isProtected(req(path))).toBe(true);
      expect(isProtected(req(`/en${path}`))).toBe(true);
      expect(isProtected(req(`/ar${path}`))).toBe(true);
    }
  });
});
