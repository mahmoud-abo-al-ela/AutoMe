import { describe, it, expect } from "vitest";
import { toPrefixTsquery, toTrigramTerm } from "./search-query";

describe("toPrefixTsquery", () => {
  it("makes every word a prefix match", () => {
    expect(toPrefixTsquery("toyota cor")).toBe("toyota:* & cor:*");
  });

  it("expands an Arabic brand to the English column value", () => {
    expect(toPrefixTsquery("نيسان")).toBe("nissan:*");
  });

  it("expands an Arabic city", () => {
    expect(toPrefixTsquery("القاهرة")).toBe("cairo:*");
  });

  it("expands an Arabic attribute value", () => {
    expect(toPrefixTsquery("بنزين")).toBe("gasoline:*");
  });

  it("keeps a free word beside an alias", () => {
    // The Arabic word has no alias and no ASCII, so it drops out; the brand
    // and the year survive.
    expect(toPrefixTsquery("نيسان 2020")).toBe("nissan:* & 2020:*");
  });

  it("ORs the alternatives when one name maps to several stored values", () => {
    // "المحلة الكبرى" is spelled three ways in the data.
    const query = toPrefixTsquery("المحلة الكبرى");

    expect(query.startsWith("(")).toBe(true);
    expect(query).toContain(" | ");
    // Each alternative keeps its own words ANDed together. Repeated words are
    // dropped, so "Al Mahallah al Kubra" contributes one "al".
    expect(query).toContain("al:* & mahallah:* & kubra:*");
    expect(query).toContain("el:* & mahalla:* & kubra:*");
  });

  it("folds Latin diacritics so a marked name is not split mid-word", () => {
    // "Al Maḩallah al Kubrá" is in live data. Without folding, the reduction
    // split it at the mark into "ma" and "allah" and produced a third,
    // useless alternative; folded, it collapses onto the unmarked spelling.
    expect(toPrefixTsquery("المحلة الكبرى")).toBe(
      "(al:* & mahallah:* & kubra:* | el:* & mahalla:* & kubra:*)"
    );
  });

  it("returns empty for input that reduces to nothing", () => {
    expect(toPrefixTsquery("")).toBe("");
    expect(toPrefixTsquery("   ")).toBe("");
    // Arabic with no alias has no ASCII left to search.
    expect(toPrefixTsquery("سيارة جميلة")).toBe("");
  });

  it("strips anything that could break out of to_tsquery", () => {
    // Quotes, backslashes and tsquery operators must not survive reduction.
    const query = toPrefixTsquery("a' | b & c:* ! d\\");

    expect(query).toBe("a:* & b:* & c:* & d:*");
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
