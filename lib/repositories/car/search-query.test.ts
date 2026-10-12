import { describe, it, expect } from "vitest";
import { MAX_SEARCH_TERMS, correctableWord, correctedTerm, correctionNames, searchTerms } from "./search-query";

/** Every term ANDed — the tsquery a search requiring all of its words runs. */
const toPrefixTsquery = (term: string) =>
  searchTerms(term)
    .map((t) => t.query)
    .join(" & ");

describe("searchTerms: the tsquery of each word", () => {
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

describe("searchTerms", () => {
  it("makes each word a term the search can judge on its own", () => {
    expect(searchTerms("عربية سيدان").map((t) => [t.text, t.query])).toEqual([
      ["عربية", "عربيه:*"],
      ["سيدان", "(سيدان:* | sedan:*)"],
    ]);
  });

  it("restricts a term's structured form to make/model and the attribute fields", () => {
    const [nissan] = searchTerms("نيسان");
    expect(nissan.structuredQuery).toBe("(نيسان:*AD | nissan:*AD)");
    const [xTrail] = searchTerms("x-trail");
    expect(xTrail.structuredQuery).toBe("x:*AD & trail:*AD");
  });

  it("reads a model year, in either kind of digit", () => {
    expect(searchTerms("2020")[0].year).toBe(2020);
    expect(searchTerms("٢٠٢٠")[0].year).toBe(2020);
    expect(searchTerms("x5")[0].year).toBeNull();
    expect(searchTerms("12345")[0].year).toBeNull();
  });

  it("carries a place's canonical values, and keeps a multi-word place whole", () => {
    expect(searchTerms("القاهرة")[0].places).toContain("CAI");
    const terms = searchTerms("المحلة الكبرى");
    expect(terms).toHaveLength(1);
    expect(terms[0].places.length).toBeGreaterThan(0);
  });

  it("counts a word and its alias once", () => {
    expect(searchTerms("نيسان nissan nissan")).toHaveLength(2);
    expect(searchTerms("toyota toyota")).toHaveLength(1);
  });

  it("judges at most eight terms", () => {
    expect(searchTerms("a1 b2 c3 d4 e5 f6 g7 h8 i9 j10")).toHaveLength(MAX_SEARCH_TERMS);
  });

  it("drops what has no word to search for", () => {
    expect(searchTerms("؟؟ !!! ...")).toEqual([]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("correctableWord", () => {
  const word = (text: string) => correctableWord(searchTerms(text)[0]!);

  it("offers a free word for correction, folded", () => {
    expect(word("Corola")).toBe("corola");
    expect(word("كرولا")).toBe("كرولا");
  });

  it("never offers a model code or a year", () => {
    expect(word("X5")).toBeNull();
    expect(word("320i")).toBeNull();
    expect(word("2020")).toBeNull();
    expect(word("٢٠٢٠")).toBeNull();
  });

  it("never offers an alias, a known value or a place", () => {
    expect(word("نيسان")).toBeNull();
    expect(word("القاهرة")).toBeNull();
  });

  it("never offers a short word", () => {
    expect(word("kia")).toBeNull();
  });
});

describe("correctedTerm", () => {
  it("matches any of the known words by prefix, keeping what was typed", () => {
    expect(correctedTerm("corola", ["corolla"])).toMatchObject({ text: "corola", query: "corolla:*", places: [], year: null });
    expect(correctedTerm("corola", ["corolla", "corona"])?.query).toBe("(corolla:* | corona:*)");
  });

  it("reaches what a known name stands for", () => {
    const term = correctedTerm("تيوتا", ["تويوتا"]);
    expect(term?.text).toBe("تيوتا");
    expect(term?.query).toContain("toyota:*");
    expect(term?.query).toContain("تويوتا:*");
  });
});

describe("correctionNames", () => {
  it("holds the alias index's one-word names, folded, to the name as written", () => {
    const names = correctionNames();
    expect(names.get("تويوتا")).toBe("تويوتا");
    expect(names.get("اوتوماتيك")).toBe("أوتوماتيك");
    // An English make is in every listing that has it: the vocabulary offers that one.
    expect(names.has("toyota")).toBe(false);
  });

  it("leaves out names a typo of one word cannot be, and short ones", () => {
    const names = correctionNames();
    expect([...names.values()]).not.toContain("مرسيدس بنز");
    expect(names.has("كيا")).toBe(false);
  });
});
