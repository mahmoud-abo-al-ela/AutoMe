import { describe, it, expect } from "vitest";
import { expandSearchTerm, hasAlias } from "./search-aliases";

describe("expandSearchTerm", () => {
  it("maps an Arabic city to the value stored in the column", () => {
    expect(expandSearchTerm("القاهرة")).toContain("Cairo");
    expect(expandSearchTerm("الجيزة")).toContain("Giza");
    expect(expandSearchTerm("الإسكندرية")).toContain("Alexandria");
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
    // Without the definite article, with a ha for ta marbuta, and with a bare
    // alef for hamza — all of which readers type.
    expect(expandSearchTerm("القاهره")).toContain("Cairo");
    expect(expandSearchTerm("الاسكندرية")).toContain("Alexandria");
    expect(expandSearchTerm("الإسكندريه")).toContain("Alexandria");
  });

  it("returns several stored values when one Arabic name covers them", () => {
    // "المحلة الكبرى" is stored three different ways in live data.
    const mahalla = expandSearchTerm("المحلة الكبرى");

    expect(mahalla).toContain("Al Mahallah al Kubra");
    expect(mahalla.length).toBeGreaterThan(2);
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
