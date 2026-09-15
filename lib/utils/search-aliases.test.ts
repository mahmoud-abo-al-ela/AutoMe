import { describe, it, expect } from "vitest";
import {
  expandSearchTerm,
  expandSearchTermForText,
  hasAlias,
} from "./search-aliases";

describe("expandSearchTerm", () => {
  it("maps a place name to the value the column stores", () => {
    // Organization.city holds a slug and Organization.region a governorate
    // code, both from lib/constants/egypt-locations.
    expect(expandSearchTerm("القاهرة")).toContain("cairo");
    expect(expandSearchTerm("القاهرة")).toContain("C");
    expect(expandSearchTerm("الجيزة")).toContain("giza");
    expect(expandSearchTerm("الإسكندرية")).toContain("alexandria");
  });

  it("maps the English spelling to the same stored value", () => {
    // Both languages are display forms; neither is what the column holds.
    expect(expandSearchTerm("Cairo")).toContain("cairo");
    expect(expandSearchTerm("Giza")).toContain("giza");
  });

  it("maps an Arabic brand to the stored brand", () => {
    expect(expandSearchTerm("نيسان")).toContain("Nissan");
    expect(expandSearchTerm("أودي")).toContain("Audi");
    expect(expandSearchTerm("بي إم دبليو")).toContain("BMW");
  });

  it("maps Arabic attribute values too", () => {
    expect(expandSearchTerm("بنزين")).toContain("Gasoline");
    expect(expandSearchTerm("أوتوماتيك")).toContain("Automatic");
  });

  it("always keeps the original term", () => {
    expect(expandSearchTerm("القاهرة")).toContain("القاهرة");
    expect(expandSearchTerm("Corolla")).toEqual(["Corolla"]);
  });

  it("tolerates how Arabic is actually typed", () => {
    // Without the hamza, and with a ha for the ta marbuta.
    expect(expandSearchTerm("الاسكندرية")).toContain("alexandria");
    expect(expandSearchTerm("الاسكندريه")).toContain("alexandria");
  });

  it("resolves a multi-word place name as one unit", () => {
    expect(expandSearchTerm("المحلة الكبرى")).toContain("el-mahalla-el-kubra");
    expect(expandSearchTerm("El Mahalla El Kubra")).toContain(
      "el-mahalla-el-kubra"
    );
  });

  it("leaves unknown terms alone", () => {
    expect(expandSearchTerm("Alexandria Motors")).toEqual(["Alexandria Motors"]);
    expect(hasAlias("Alexandria Motors")).toBe(false);
    expect(hasAlias("القاهرة")).toBe(true);
  });

  it("handles empty input", () => {
    expect(expandSearchTerm("")).toEqual([]);
    expect(expandSearchTerm("   ")).toEqual([]);
  });
});

describe("expandSearchTermForText", () => {
  it("drops variants too short to substring-match safely", () => {
    // Cairo's governorate code is "C". A `contains "C"` — or a `c:*` tsquery
    // prefix — matches nearly every row, so it must never reach a text matcher.
    const all = expandSearchTerm("القاهرة");
    const text = expandSearchTermForText("القاهرة");

    expect(all).toContain("C");
    expect(text).not.toContain("C");
    expect(text).toContain("cairo");
  });

  it("keeps everything long enough to be a real filter", () => {
    expect(expandSearchTermForText("نيسان")).toContain("Nissan");
    expect(expandSearchTermForText("الجيزة")).toContain("giza");
  });

  it("never returns a variant under three characters", () => {
    for (const term of ["القاهرة", "الجيزة", "السويس", "قنا", "Cairo"]) {
      for (const variant of expandSearchTermForText(term)) {
        expect(variant.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
