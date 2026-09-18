import { describe, it, expect } from "vitest";
import { toPrefixTsquery, toTrigramTerm } from "./search-query";

describe("toPrefixTsquery", () => {
  it("makes every word a prefix match", () => {
    expect(toPrefixTsquery("toyota cor")).toBe("toyota:* & cor:*");
  });

  it("expands an Arabic brand to the English column value", () => {
    expect(toPrefixTsquery("نيسان")).toBe("nissan:*");
  });

  it("expands an Arabic city to the English name the columns hold", () => {
    // The Arabic word itself has no ASCII left after reduction, so what
    // survives is the English name the free-text columns hold.
    expect(toPrefixTsquery("القاهرة")).toBe("cairo:*");
  });

  it("never emits a prefix short enough to match everything", () => {
    // A canonical value never reaches this path, so nothing as short as a
    // governorate code can become a bare prefix here.
    for (const term of ["القاهرة", "الجيزة", "قنا", "السويس"]) {
      for (const piece of toPrefixTsquery(term).split(/[^a-z0-9]+/).filter(Boolean)) {
        expect(piece.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("expands an Arabic attribute value", () => {
    expect(toPrefixTsquery("بنزين")).toBe("gasoline:*");
  });

  it("keeps a free word beside an alias", () => {
    // The Arabic word has no alias and no ASCII, so it drops out; the brand
    // and the year survive.
    expect(toPrefixTsquery("نيسان 2020")).toBe("nissan:* & 2020:*");
  });

  it("resolves a multi-word place name to its single stored value", () => {
    // One entry per place, so there is nothing left to OR between.
    expect(toPrefixTsquery("المحلة الكبرى")).toBe("el:* & mahalla:* & kubra:*");
  });

  it("returns empty for input that reduces to nothing", () => {
    expect(toPrefixTsquery("")).toBe("");
    expect(toPrefixTsquery("   ")).toBe("");
    // Arabic with no alias has no ASCII left to search.
    expect(toPrefixTsquery("سيارة جميلة")).toBe("");
  });

  it("strips anything that could break out of to_tsquery", () => {
    // Quotes, backslashes and tsquery operators must not survive reduction.
    const query = toPrefixTsquery("ab' | cd & ef:* ! gh\\");

    expect(query).toBe("ab:* & cd:* & ef:* & gh:*");
  });

  it("keeps the reader's own short words, however short", () => {
    // Alias expansion filters short values it invents, but never the words
    // that were typed: "X5" and "A4" are real models.
    expect(toPrefixTsquery("BMW X5")).toBe("bmw:* & x5:*");
    expect(toPrefixTsquery("A4")).toBe("a4:*");
  });

  it("lowercases, matching the simple text-search config", () => {
    expect(toPrefixTsquery("Toyota COROLLA")).toBe("toyota:* & corolla:*");
  });
});

describe("toTrigramTerm", () => {
  it("resolves an Arabic term to an English one the columns hold", () => {
    expect(toTrigramTerm("نيسان")).toBe("Nissan");
  });

  it("leaves a term with no alias alone, typos included", () => {
    expect(toTrigramTerm("corola")).toBe("corola");
  });

  it("handles empty input", () => {
    expect(toTrigramTerm("")).toBe("");
  });
});
