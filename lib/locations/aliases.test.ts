import { describe, it, expect } from "vitest";
import { expandSearchTerm, expandSearchTermForText, hasAlias } from "./aliases";
import { EGYPT_CITIES, EGYPT_GOVERNORATES } from "./data";

describe("expandSearchTerm", () => {
  it("maps a place name to the value the column stores", () => {
    // Organization.region holds a governorate code and Organization.city a
    // slug, both from lib/locations/data.
    expect(expandSearchTerm("القاهرة").exact).toContain("CAI");
    expect(expandSearchTerm("الجيزة").exact).toContain("GIZ");
    expect(expandSearchTerm("المنصورة").exact).toContain("mansoura");
    expect(expandSearchTerm("التجمع الخامس").exact).toContain(
      "fifth-settlement"
    );
  });

  it("maps the English spelling to the same stored value", () => {
    // Both languages are display forms; neither is what the column holds.
    expect(expandSearchTerm("Cairo").exact).toContain("CAI");
    expect(expandSearchTerm("Mansoura").exact).toContain("mansoura");
  });

  it("also reaches the English name, for the free-text columns", () => {
    // An address or a description mentioning Cairo holds the name, which no
    // code can match.
    expect(expandSearchTerm("القاهرة").text).toContain("Cairo");
    expect(expandSearchTerm("المنصورة").text).toContain("Mansoura");
  });

  it("maps an Arabic brand to the stored brand", () => {
    expect(expandSearchTerm("نيسان").text).toContain("Nissan");
    expect(expandSearchTerm("أودي").text).toContain("Audi");
    expect(expandSearchTerm("بي إم دبليو").text).toContain("BMW");
  });

  it("maps Arabic attribute values too", () => {
    expect(expandSearchTerm("بنزين").text).toContain("Gasoline");
    expect(expandSearchTerm("أوتوماتيك").text).toContain("Automatic");
  });

  it("always keeps the original term, first", () => {
    expect(expandSearchTerm("القاهرة").text[0]).toBe("القاهرة");
    expect(expandSearchTerm("Corolla")).toEqual({
      exact: [],
      text: ["Corolla"],
    });
  });

  it("tolerates how Arabic is actually typed", () => {
    // Without the hamza, and with a ha for the ta marbuta.
    expect(expandSearchTerm("الاسكندرية").exact).toContain("ALX");
    expect(expandSearchTerm("الاسكندريه").exact).toContain("ALX");
  });

  it("resolves a multi-word place name as one unit", () => {
    expect(expandSearchTerm("المحلة الكبرى").exact).toContain(
      "el-mahalla-el-kubra"
    );
    expect(expandSearchTerm("El Mahalla El Kubra").exact).toContain(
      "el-mahalla-el-kubra"
    );
  });

  it("leaves unknown terms alone", () => {
    expect(expandSearchTerm("Alexandria Motors")).toEqual({
      exact: [],
      text: ["Alexandria Motors"],
    });
    expect(hasAlias("Alexandria Motors")).toBe(false);
    expect(hasAlias("القاهرة")).toBe(true);
  });

  it("handles empty input", () => {
    expect(expandSearchTerm("")).toEqual({ exact: [], text: [] });
    expect(expandSearchTerm("   ")).toEqual({ exact: [], text: [] });
    expect(expandSearchTermForText("")).toEqual([]);
  });
});

describe("the split between exact and text variants", () => {
  /**
   * The invariant that replaced two heuristics. The previous version returned
   * one flat list, so every caller had to guess which entries were safe to
   * substring-match — and the guesses were a length floor and a set membership
   * check, spread across three files. A canonical value reaching a `contains`
   * is what made searching "القاهرة" return every dealership with a "c" in its
   * description.
   */
  it("never offers a governorate code or a city slug as text", () => {
    const canonical = new Set([
      ...EGYPT_GOVERNORATES.map((governorate) => governorate.code),
      ...EGYPT_CITIES.map((city) => city.slug),
    ]);

    for (const row of [...EGYPT_GOVERNORATES, ...EGYPT_CITIES]) {
      for (const surface of [row.en, row.ar]) {
        const { text } = expandSearchTerm(surface);
        // The reader's own words are never filtered, only what this adds.
        for (const variant of text.slice(1)) {
          expect(canonical.has(variant)).toBe(false);
        }
      }
    }
  });

  it("never offers a display name as an exact value", () => {
    const canonical = new Set([
      ...EGYPT_GOVERNORATES.map((governorate) => governorate.code),
      ...EGYPT_CITIES.map((city) => city.slug),
    ]);

    // A name can legitimately yield more than one canonical value — "الجيزة"
    // is both the governorate and a district of it — but never a name.
    for (const row of [...EGYPT_GOVERNORATES, ...EGYPT_CITIES]) {
      for (const surface of [row.en, row.ar]) {
        for (const variant of expandSearchTerm(surface).exact) {
          expect(canonical.has(variant)).toBe(true);
        }
      }
    }
  });

  it("reaches both buckets from either spelling", () => {
    for (const city of EGYPT_CITIES) {
      for (const surface of [city.en, city.ar]) {
        expect(expandSearchTerm(surface).exact).toContain(city.slug);
        expect(expandSearchTerm(surface).text).toContain(city.en);
      }
    }
  });

  it("keeps a code the reader typed themselves", () => {
    // Filtering applies to values this module invents, not to the query.
    expect(expandSearchTermForText("CAI")).toContain("CAI");
  });

  it("no longer drops a two-letter brand", () => {
    // The old length floor existed to keep governorate codes out of text
    // matchers, and took DS and MG with it: searching their Arabic names found
    // nothing. Splitting the buckets means the floor is not needed at all.
    expect(expandSearchTermForText("دي إس")).toContain("DS");
    expect(expandSearchTermForText("إم جي")).toContain("MG");
  });
});
