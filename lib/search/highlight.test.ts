import { describe, it, expect } from "vitest";
import { highlightRanges, splitByRanges, writtenForm } from "./highlight";

/** The marked pieces of `text`, as the reader sees them. */
const marked = (text: string, words: string[]) =>
  splitByRanges(text, highlightRanges(text, words))
    .filter((part) => part.marked)
    .map((part) => part.text);

describe("highlightRanges", () => {
  it("marks a word whatever its case, by prefix, at a word's start", () => {
    expect(marked("2020 Toyota COROLLA", ["corolla"])).toEqual(["COROLLA"]);
    expect(marked("Toyota Corolla", ["cor"])).toEqual(["Cor"]);
    // Not inside a word: the search matches a word's start only.
    expect(marked("Accord", ["cor"])).toEqual([]);
  });

  it("marks Arabic as written, whichever way it was typed", () => {
    expect(marked("سيارة نظيفة جدا", ["سياره"])).toEqual(["سيارة"]);
    expect(marked("أوتوماتيك", ["اوتوماتيك"])).toEqual(["أوتوماتيك"]);
    expect(marked("مستشفى", ["مستشفي"])).toEqual(["مستشفى"]);
  });

  it("marks through tashkeel and tatweel, keeping them inside the mark", () => {
    expect(marked("سَيّارَة", ["سياره"])).toEqual(["سَيّارَة"]);
    expect(marked("ســيارة", ["سياره"])).toEqual(["ســيارة"]);
  });

  it("marks Arabic-Indic digits for ASCII ones", () => {
    expect(marked("موديل ٢٠٢٠", ["2020"])).toEqual(["٢٠٢٠"]);
  });

  it("marks every occurrence, once each, merging overlaps", () => {
    expect(marked("Corolla, the corolla", ["corolla"])).toEqual(["Corolla", "corolla"]);
    expect(marked("Corolla", ["cor", "corolla"])).toEqual(["Corolla"]);
  });

  it("accepts the words as typed, or folded", () => {
    expect(marked("Toyota Corolla", ["COROLLA"])).toEqual(["Corolla"]);
    expect(marked("نيسان صني", ["نيسان", "nissan"])).toEqual(["نيسان"]);
  });

  it("lands on whole characters around emoji and other surrogate pairs", () => {
    const text = "🚗 Corolla 🚙";
    const [range] = highlightRanges(text, ["corolla"]);
    expect(text.slice(range!.start, range!.end)).toBe("Corolla");
    expect(marked("😀corolla", ["corolla"])).toEqual(["corolla"]);
  });

  it("maps back through a character that folds to two", () => {
    // "İ" lowercases to two code units; the mark must still cover "İzmir" exactly.
    expect(marked("İzmir Corolla", ["izmir"])).toEqual(["İzmir"]);
    expect(marked("İzmir Corolla", ["corolla"])).toEqual(["Corolla"]);
  });

  it("marks nothing for no words, or words with nothing searchable", () => {
    expect(highlightRanges("Toyota Corolla", [])).toEqual([]);
    expect(highlightRanges("Toyota Corolla", ["؟؟", "!!"])).toEqual([]);
    expect(highlightRanges("", ["corolla"])).toEqual([]);
  });

  it("splits text into runs that add back up to it, markup and all", () => {
    const text = "<b>Corolla</b> & co";
    const parts = splitByRanges(text, highlightRanges(text, ["corolla"]));
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.marked).map((part) => part.text)).toEqual(["Corolla"]);
  });
});

describe("writtenForm", () => {
  it("finds a folded word as a listing spells it", () => {
    expect(writtenForm("فتحه", ["سيارة بفتحة", "فتحة سقف بانوراما"])).toBe("فتحة");
    expect(writtenForm("اوتوماتيك", ["ناقل حركة أوتوماتيك"])).toBe("أوتوماتيك");
  });

  it("matches a whole word, not the start of a longer one", () => {
    expect(writtenForm("corolla", ["Corollas are great", "a Corolla"])).toBe("Corolla");
  });

  it("is null when no text has the word", () => {
    expect(writtenForm("corolla", ["Camry", null, undefined])).toBeNull();
    expect(writtenForm("؟؟", ["anything"])).toBeNull();
  });
});
