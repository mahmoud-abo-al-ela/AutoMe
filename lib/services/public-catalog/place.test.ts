import { describe, it, expect } from "vitest";
import { resolvePlace } from "./place";

describe("resolvePlace", () => {
  it("maps a city's English name, Arabic name and slug to the slug", () => {
    for (const name of ["New Cairo", "  new cairo ", "القاهرة الجديدة", "new-cairo"]) {
      expect(resolvePlace(name), name).toEqual({ city: "new-cairo" });
    }
  });

  it("maps a governorate to its code, so it covers its cities", () => {
    expect(resolvePlace("Cairo")).toEqual({ region: "CAI" });
    expect(resolvePlace("القاهرة")).toEqual({ region: "CAI" });
    expect(resolvePlace("Luxor")).toEqual({ region: "LXR" });
  });

  it("keeps an unknown name as a city, so it narrows to nothing rather than being dropped", () => {
    expect(resolvePlace("Atlantis")).toEqual({ city: "Atlantis" });
  });

  it("is no filter when there is no name", () => {
    expect(resolvePlace(undefined)).toEqual({});
    expect(resolvePlace("  ")).toEqual({});
  });
});
