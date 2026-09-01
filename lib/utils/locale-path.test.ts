import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { localized, localeOf, pathnameWithoutLocale } from "./locale-path";
import { PROTECTED_ROUTES } from "../route-policy";

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
    // Driven off the real list, not a copy of it. The copy is what let the
    // middleware guard three routes that did not exist while /test-drive and
    // /wishlist stayed open.
    const isProtected = createRouteMatcher(localized(PROTECTED_ROUTES));

    for (const pattern of PROTECTED_ROUTES) {
      const path = pattern.replace("(.*)", "");
      expect(isProtected(req(path))).toBe(true);
      expect(isProtected(req(`/en${path}`))).toBe(true);
      expect(isProtected(req(`/ar${path}`))).toBe(true);
    }
  });

  it("guards a route for every signed-in page that exists", () => {
    // Guards against the reverse drift: a pattern that matches nothing real.
    // Every entry must name a directory under app/[locale].
    const appDir = path.join(process.cwd(), "app", "[locale]");
    const dirs = new Set<string>();
    for (const group of fs.readdirSync(appDir, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      dirs.add(group.name);
      // Route groups like (site) are not URL segments; look inside them too.
      if (group.name.startsWith("(")) {
        for (const child of fs.readdirSync(path.join(appDir, group.name), {
          withFileTypes: true,
        })) {
          if (child.isDirectory()) dirs.add(child.name);
        }
      }
    }

    for (const pattern of PROTECTED_ROUTES) {
      const segment = pattern.replace("(.*)", "").slice(1);
      expect(dirs, `${pattern} names no directory under app/[locale]`).toContain(
        segment
      );
    }
  });
});
