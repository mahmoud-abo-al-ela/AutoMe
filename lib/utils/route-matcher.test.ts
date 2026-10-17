import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { localizedPathMatcher, pathMatcher } from "./route-matcher";
import {
  MAIN_DOMAIN_ONLY_ROUTES,
  PROTECTED_ROUTES,
  SUBDOMAIN_REDIRECT_TO_HOME_ROUTES,
} from "../route-policy";

describe("pathMatcher", () => {
  const isApi = pathMatcher(["/api(.*)", "/trpc(.*)"]);
  const isCrawlerFile = pathMatcher(["/sitemap.xml", "/robots.txt"]);

  it("matches a prefix pattern's path and everything under it", () => {
    expect(isApi("/api")).toBe(true);
    expect(isApi("/api/webhooks/clerk")).toBe(true);
    expect(isApi("/trpc/a")).toBe(true);
  });

  it("matches an exact pattern alone, with or without a trailing slash", () => {
    expect(isCrawlerFile("/sitemap.xml")).toBe(true);
    expect(isCrawlerFile("/robots.txt/")).toBe(true);
    expect(isCrawlerFile("/sitemap.xml/extra")).toBe(false);
  });

  it("never reads a locale prefix", () => {
    expect(isApi("/en/api/x")).toBe(false);
    expect(isCrawlerFile("/en/sitemap.xml")).toBe(false);
  });

  it("ignores case and repeated slashes, as Clerk's matcher did", () => {
    expect(isApi("/API/x")).toBe(true);
    expect(pathMatcher(["/org(.*)"])("//org")).toBe(true);
  });
});

describe("localizedPathMatcher", () => {
  it("matches both the prefixed and unprefixed form", () => {
    const isSuperAdmin = localizedPathMatcher(["/super-admin(.*)"]);

    expect(isSuperAdmin("/super-admin")).toBe(true);
    expect(isSuperAdmin("/en/super-admin")).toBe(true);
    expect(isSuperAdmin("/ar/super-admin/users")).toBe(true);
    expect(isSuperAdmin("/AR/Super-Admin")).toBe(true);
    expect(isSuperAdmin("/en//super-admin")).toBe(true);
  });

  it("still refuses unrelated routes", () => {
    const isSuperAdmin = localizedPathMatcher(["/super-admin(.*)"]);

    expect(isSuperAdmin("/cars")).toBe(false);
    expect(isSuperAdmin("/en/cars")).toBe(false);
    expect(isSuperAdmin("/fr/super-admin")).toBe(false);
    // Pinning existing behaviour rather than endorsing it: a prefix pattern
    // matches a sibling path that merely starts with the same string. It errs
    // toward over-guarding, so it is not a hole — but worth knowing before
    // someone tightens the patterns.
    expect(isSuperAdmin("/en/super-admin-impostor")).toBe(true);
  });

  it("keeps an exact pattern exact under a locale", () => {
    // On a storefront, the dealership list redirects home — a dealership's own
    // page must not.
    const redirectsHome = localizedPathMatcher(SUBDOMAIN_REDIRECT_TO_HOME_ROUTES);

    expect(redirectsHome("/en/dealerships")).toBe(true);
    expect(redirectsHome("/ar/dealerships/")).toBe(true);
    expect(redirectsHome("/en/dealerships/cairo-motors")).toBe(false);
  });

  it("keeps the dealer pitch and onboarding off storefronts", () => {
    const mainDomainOnly = localizedPathMatcher(MAIN_DOMAIN_ONLY_ROUTES);

    expect(mainDomainOnly("/en/onboarding/success")).toBe(true);
    expect(mainDomainOnly("/ar/for-dealers")).toBe(true);
    expect(mainDomainOnly("/en/cars")).toBe(false);
  });

  it("covers every protected route family in both locales", () => {
    // Driven off the real list, not a copy of it. A copy is what once let the
    // middleware guard three routes that did not exist while /test-drive and
    // /wishlist stayed open.
    const isProtected = localizedPathMatcher(PROTECTED_ROUTES);

    for (const pattern of PROTECTED_ROUTES) {
      const route = pattern.replace("(.*)", "");
      expect(isProtected(route)).toBe(true);
      expect(isProtected(`/en${route}`)).toBe(true);
      expect(isProtected(`/ar${route}`)).toBe(true);
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
