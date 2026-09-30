import { describe, it, expect } from "vitest";
import { toPrefixTsquery, toTrigramTerm } from "./search-query";

describe("toPrefixTsquery", () => {
  it("makes every word a prefix match", () => {
    expect(toPrefixTsquery("toyota cor")).toBe("toyota:* & cor:*");
  });

  it("searches an Arabic brand as itself and as the English column value", () => {
    // Both halves are needed. The `make` column holds "Nissan", and a dealer's
    // own description may well say "نيسان" — one query has to reach both.
    expect(toPrefixTsquery("نيسان")).toBe("(نيسان:* | nissan:*)");
  });

  it("searches an Arabic city as itself and as the English name", () => {
    expect(toPrefixTsquery("القاهرة")).toBe("(القاهره:* | cairo:*)");
  });

  it("never emits a prefix short enough to match everything", () => {
    // A canonical value never reaches this path, so nothing as short as a
    // governorate code can become a bare prefix here.
    for (const term of ["القاهرة", "الجيزة", "قنا", "السويس"]) {
      for (const piece of toPrefixTsquery(term).split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
        expect(piece.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("expands an Arabic attribute value", () => {
    expect(toPrefixTsquery("بنزين")).toBe("(بنزين:* | gasoline:*)");
  });

  it("keeps a free word beside an alias", () => {
    expect(toPrefixTsquery("نيسان 2020")).toBe("(نيسان:* | nissan:*) & 2020:*");
  });

  it("resolves a multi-word place name to its single stored value", () => {
    expect(toPrefixTsquery("المحلة الكبرى")).toBe(
      "(المحله:* & الكبري:* | el:* & mahalla:* & kubra:*)"
    );
  });

  it("searches Arabic prose that has no alias at all", () => {
    // The whole point of folding the index: a dealer writes the listing in
    // Arabic, and none of those words is a brand or a place. Before, this
    // reduced to the empty query and returned the entire catalogue.
    expect(toPrefixTsquery("سيارة جميلة")).toBe("سياره:* & جميله:*");
  });

  it("returns empty only when nothing at all survives", () => {
    expect(toPrefixTsquery("")).toBe("");
    expect(toPrefixTsquery("   ")).toBe("");
    expect(toPrefixTsquery("!!! ... ???")).toBe("");
  });

  it("folds the spellings a reader uses interchangeably", () => {
    // Each pair is the same word typed two ways. They have to produce the
    // same query, because the stored vector folds them the same way.
    const same: [string, string][] = [
      ["سياره", "سيارة"], //   ta marbuta
      ["احمد", "أحمد"], //     alef with hamza
      ["الاسكندريه", "الإسكندرية"],
      ["مصطفي", "مصطفى"], //   alef maqsura
      ["سيارة", "سَيَّارَة"], //    tashkeel
      ["سيارة", "سيــارة"], //  tatweel
    ];

    for (const [plain, marked] of same) {
      expect(toPrefixTsquery(marked), `${marked} vs ${plain}`).toBe(
        toPrefixTsquery(plain)
      );
    }
  });

  it("reads Arabic-Indic digits as the numbers they are", () => {
    // The Arabic UI renders years and prices in Eastern numerals, so that is
    // what gets copied back into the search box. The columns hold 2020.
    expect(toPrefixTsquery("٢٠٢٠")).toBe("2020:*");
    expect(toPrefixTsquery("نيسان ٢٠٢٠")).toBe("(نيسان:* | nissan:*) & 2020:*");
  });

  it("strips anything that could break out of to_tsquery", () => {
    // Quotes, backslashes and tsquery operators must not survive reduction.
    const query = toPrefixTsquery("ab' | cd & ef:* ! gh\\");

    expect(query).toBe("ab:* & cd:* & ef:* & gh:*");
  });

  it("strips Arabic punctuation too, which carries its own operators", () => {
    // The Arabic block has its own comma, semicolon and question mark; none of
    // them may reach the tsquery.
    const query = toPrefixTsquery("سيارة، جميلة؟ نعم؛ جدا");

    expect(query).toBe("سياره:* & جميله:* & نعم:* & جدا:*");
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
