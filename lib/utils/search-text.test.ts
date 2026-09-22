import { describe, it, expect } from "vitest";
import { foldSearchText, searchWords } from "./search-text";
import { FOLD_FIXTURES } from "./search-text.fixtures";

describe("foldSearchText", () => {
  it("folds every spelling a reader uses interchangeably", () => {
    const same: [string, string][] = [
      ["سياره", "سيارة"], //         ة -> ه
      ["احمد", "أحمد"], //           أ -> ا
      ["اسكندريه", "إسكندرية"], //   إ -> ا
      ["الان", "الآن"], //           آ -> ا
      ["مصطفي", "مصطفى"], //         ى -> ي
      ["سيارة", "سَيَّارَة"], //          tashkeel
      ["سيارة", "سيــارة"], //        tatweel
    ];

    for (const [plain, marked] of same) {
      expect(foldSearchText(marked), `${marked} vs ${plain}`).toBe(
        foldSearchText(plain)
      );
    }
  });

  it("leaves the other hamza carriers alone", () => {
    // ؤ and ئ are not folded. Doing so would not make these two spellings
    // of the same word meet — they would fold to different words — so it
    // would only risk collapsing two real words into one.
    expect(foldSearchText("مسؤول")).not.toBe(foldSearchText("مسئول"));
    expect(foldSearchText("مسؤول")).toBe("مسؤول");
  });

  it("keeps the Arabic-Indic digits long enough to fold them to ASCII", () => {
    // The mark-stripping pass runs first, and the obvious way to write its
    // character class is a range that swallows these.
    expect(foldSearchText("٢٠٢٠")).toBe("2020");
    expect(foldSearchText("۲۰۲۰")).toBe("2020");
    expect(foldSearchText("موديل ٢٠٢٠")).toBe("موديل 2020");
  });

  it("lowercases, matching the simple text-search config", () => {
    expect(foldSearchText("Toyota COROLLA")).toBe("toyota corolla");
  });

  it("leaves Latin diacritics alone", () => {
    // Deliberate: the stored vector does not fold them either, and the two
    // sides have to agree. `searchWords` strips them on the query side only.
    expect(foldSearchText("Kubrá")).toBe("kubrá");
  });

  it("is idempotent", () => {
    // It runs once on the way into the index and once on the way into the
    // query; a fold that moved on a second pass would put the two out of step.
    for (const value of FOLD_FIXTURES) {
      expect(foldSearchText(foldSearchText(value)), value).toBe(
        foldSearchText(value)
      );
    }
  });
});

describe("searchWords", () => {
  it("keeps Arabic words, which the old reduction discarded entirely", () => {
    expect(searchWords("سيارة جميلة")).toEqual(["سياره", "جميله"]);
  });

  it("folds Latin diacritics so a place name stays one word", () => {
    // Without this the word splits at the mark into "ma" and "allah".
    expect(searchWords("Al Maḩallah al Kubrá")).toEqual([
      "al",
      "mahallah",
      "al",
      "kubra",
    ]);
  });

  it("drops everything that could break out of a tsquery", () => {
    // The result is interpolated into `to_tsquery`, so no quote, backslash or
    // operator may survive — in either script.
    const dangerous = "ab' | cd & ef:* ! (gh) \\ سيارة، جميلة؟ نعم؛ ٪";

    for (const word of searchWords(dangerous)) {
      expect(word, word).toMatch(/^[a-z0-9ء-غف-ي]+$/);
    }
  });

  it("returns nothing for input that is all punctuation", () => {
    expect(searchWords("!!! ... ؟؟؟ ،")).toEqual([]);
    expect(searchWords("")).toEqual([]);
  });
});
