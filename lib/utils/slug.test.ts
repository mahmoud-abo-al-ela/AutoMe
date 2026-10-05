import { describe, it, expect } from "vitest";
import {
  isValidSlug,
  normalizeSlugInput,
  slugFromName,
  SLUG_MAX_LENGTH,
} from "./slug";

describe("slugFromName", () => {
  it("builds a slug from a Latin name", () => {
    expect(slugFromName("Nile Motors")).toBe("nile-motors");
    expect(slugFromName("  Cairo   Premium Cars! ")).toBe("cairo-premium-cars");
    expect(slugFromName("Café Autos")).toBe("cafe-autos");
  });

  it("returns nothing for an all-Arabic name rather than inventing one", () => {
    expect(slugFromName("معرض النيل للسيارات")).toBe("");
  });

  it("keeps only the Latin part of a mixed name", () => {
    expect(slugFromName("معرض Nile Motors")).toBe("nile-motors");
    expect(slugFromName("Toyota مصر 2024")).toBe("toyota-2024");
  });

  it("never ends on a hyphen when cut at the length limit", () => {
    const slug = slugFromName(`${"a".repeat(SLUG_MAX_LENGTH - 1)} b`);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
  });
});

describe("normalizeSlugInput", () => {
  it("lowercases and hyphenates as the dealer types", () => {
    expect(normalizeSlugInput("Nile Motors")).toBe("nile-motors");
    expect(normalizeSlugInput("nile__motors")).toBe("nile-motors");
  });

  it("drops characters a subdomain cannot hold", () => {
    expect(normalizeSlugInput("نيل-motors!")).toBe("motors");
    expect(normalizeSlugInput("a--b")).toBe("a-b");
    expect(normalizeSlugInput("-nile")).toBe("nile");
  });

  it("keeps a trailing hyphen so the next word can be typed", () => {
    expect(normalizeSlugInput("nile-")).toBe("nile-");
  });
});

describe("isValidSlug", () => {
  it("accepts a complete slug", () => {
    expect(isValidSlug("nile-motors")).toBe(true);
    expect(isValidSlug("abc")).toBe(true);
  });

  it("rejects empty, short, long and malformed slugs", () => {
    for (const bad of ["", "ab", "a".repeat(SLUG_MAX_LENGTH + 1), "nile-", "-nile", "nile--motors", "Nile", "نيل"]) {
      expect(isValidSlug(bad), bad).toBe(false);
    }
  });
});
