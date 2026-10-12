import { describe, it, expect, vi, beforeEach } from "vitest";

const { countPublicMakeModels, countPublicSpecs } = vi.hoisted(() => ({
  countPublicMakeModels: vi.fn(),
  countPublicSpecs: vi.fn(),
}));
vi.mock("@/lib/repositories/car", () => ({ countPublicMakeModels, countPublicSpecs }));

import {
  MAX_SUGGESTIONS,
  matchQuality,
  matchSuggestions,
  resetSuggestionsForTests,
  suggestSearches,
} from "@/lib/services/car/search-suggestions";
import type { SpecCount } from "@/lib/repositories/car";

const PAIRS = [
  { make: "Toyota", model: "Corolla", count: 4 },
  { make: "Toyota", model: "Camry", count: 2 },
  { make: "Toyota", model: "Yaris", count: 1 },
  { make: "Toyota", model: "Land Cruiser", count: 1 },
  { make: "Tesla", model: "Model 3", count: 1 },
  { make: "Kia", model: "Cerato", count: 3 },
  { make: "BMW", model: "X5", count: 2 },
  { make: "Suzuki", model: "Swift", count: 2 },
  { make: "Skoda", model: "Superb", count: 1 },
];

const SPECS: SpecCount[] = [
  { kind: "bodyType", value: "Sedan", count: 9 },
  { kind: "bodyType", value: "SUV", count: 6 },
  { kind: "bodyType", value: "Pickup", count: 2 },
  { kind: "bodyType", value: "Pickup Truck", count: 1 },
  { kind: "fuelType", value: "Diesel", count: 2 },
  { kind: "transmission", value: "Automatic", count: 12 },
  { kind: "color", value: "Silver", count: 3 },
  { kind: "color", value: "White", count: 5 },
  { kind: "feature", value: "Sunroof", count: 7 },
  { kind: "feature", value: "Panoramic roof", count: 1 },
];

const match = (query: string, locale: "en" | "ar" = "en", specs = SPECS) => matchSuggestions(query, locale, PAIRS, specs);
const labels = (query: string, locale: "en" | "ar" = "en") => match(query, locale).map((s) => s.label);

beforeEach(() => {
  vi.resetAllMocks();
  resetSuggestionsForTests();
});

describe("matchQuality", () => {
  it("ranks an exact name, then a name's start, then a later word's start", () => {
    expect(matchQuality(["sedan"], "sedan")).toBe(0);
    expect(matchQuality(["sedan"], "sed")).toBe(1);
    expect(matchQuality(["land cruiser"], "cru")).toBe(2);
  });

  it("never matches inside a word", () => {
    expect(matchQuality(["accord"], "cor")).toBeNull();
  });
});

describe("matchSuggestions", () => {
  it("suggests a make with all its cars, setting the make filter", () => {
    expect(match("toy")[0]).toEqual({ kind: "make", label: "Toyota", count: 8, filters: { make: "Toyota" } });
  });

  it("finds a make by its Arabic name, and labels it in the reader's language", () => {
    expect(labels("تو", "ar")[0]).toBe("تويوتا");
    expect(labels("تو", "en")[0]).toBe("Toyota");
  });

  it("follows a make with its models, the most cars first", () => {
    expect(labels("toyota")).toEqual(["Toyota", "Toyota Corolla", "Toyota Camry", "Toyota Land Cruiser", "Toyota Yaris"]);
  });

  it("completes a model after its make, setting the make and searching the model", () => {
    expect(match("toyota cor")).toEqual([
      { kind: "model", label: "Toyota Corolla", count: 4, filters: { make: "Toyota" }, search: "Corolla" },
    ]);
    // Beside its model a make keeps its English name, as a car's title does.
    expect(labels("كيا", "ar")).toEqual(["كيا", "Kia Cerato"]);
  });

  it("finds a model by a later word of its name", () => {
    expect(labels("cruiser")).toEqual(["Toyota Land Cruiser"]);
  });

  it("suggests specs that set their filter, labelled in the reader's language", () => {
    expect(match("sed")).toEqual([{ kind: "bodyType", label: "Sedan", count: 9, filters: { bodyType: "Sedan" } }]);
    expect(match("سيد", "ar")).toEqual([{ kind: "bodyType", label: "سيدان", count: 9, filters: { bodyType: "Sedan" } }]);
    expect(match("أوتو", "ar")[0]).toEqual({
      kind: "transmission",
      label: "أوتوماتيك",
      count: 12,
      filters: { transmission: "Automatic" },
    });
    expect(match("whi")[0]).toEqual({ kind: "color", label: "White", count: 5, filters: { color: "White" } });
  });

  it("suggests a feature as a search, in the reader's language", () => {
    expect(match("فتحة", "ar")).toEqual([{ kind: "feature", label: "فتحة سقف", count: 7, search: "فتحة سقف" }]);
    expect(match("sunr")).toEqual([{ kind: "feature", label: "Sunroof", count: 7, search: "Sunroof" }]);
  });

  it("leaves out a spec no public car has", () => {
    expect(labels("hyb")).toEqual([]);
  });

  it("names a spec once when two values share a name, keeping the one with more cars", () => {
    expect(match("بيك", "ar")).toEqual([{ kind: "bodyType", label: "بيك أب", count: 2, filters: { bodyType: "Pickup" } }]);
  });

  it("puts an exact match first, whatever its category", () => {
    // "suv" is exactly a body type; "Suzuki" only starts with "su".
    expect(labels("suv")[0]).toBe("SUV");
  });

  it("keeps makes before models before specs at the same quality, with a place for each", () => {
    expect(labels("s")).toEqual(["Suzuki", "Skoda", "Suzuki Swift", "Skoda Superb", "Sedan", "Sunroof", "SUV", "Silver"]);
  });

  it("caps a crowded category so others still show, then fills what is left", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ make: "Toyota", model: `T${i}`, count: 12 - i }));
    const found = matchSuggestions("t", "en", many, [{ kind: "transmission", value: "Automatic", count: 1 }]);
    expect(found).toHaveLength(MAX_SUGGESTIONS);
    // No spec starts with "t", so after the make and four models the rest are models too.
    expect(found[0].kind).toBe("make");
    expect(found.filter((s) => s.kind === "model")).toHaveLength(MAX_SUGGESTIONS - 1);
  });

  it("breaks ties the same way every time", () => {
    const twins = [
      { make: "Mazda", model: "Beta", count: 1 },
      { make: "Mazda", model: "Alpha", count: 1 },
    ];
    expect(matchSuggestions("mazda", "en", twins, []).map((s) => s.label)).toEqual(["Mazda", "Mazda Alpha", "Mazda Beta"]);
  });

  it("suggests nothing for what has no searchable word", () => {
    expect(labels("؟؟ !!")).toEqual([]);
  });
});

describe("suggestSearches", () => {
  it("suggests no loose words: a word that names nothing gets nothing", async () => {
    countPublicMakeModels.mockResolvedValue(PAIRS);
    countPublicSpecs.mockResolvedValue(SPECS);
    expect(await suggestSearches("towing", "en")).toEqual([]);
  });

  it("counts every listed colour and feature, by the values a car stores", async () => {
    countPublicMakeModels.mockResolvedValue(PAIRS);
    countPublicSpecs.mockResolvedValue(SPECS);
    await suggestSearches("s", "en");
    const [colors, features] = countPublicSpecs.mock.calls[0];
    expect(colors).toEqual(expect.arrayContaining(["White", "Black", "Metallic Grey"]));
    expect(features).toEqual(expect.arrayContaining(["Sunroof", "Apple CarPlay"]));
  });

  it("asks nothing for what has no searchable word", async () => {
    expect(await suggestSearches("؟؟", "ar")).toEqual([]);
    expect(countPublicMakeModels).not.toHaveBeenCalled();
  });

  it("reads the counts once a minute, and again after a failure", async () => {
    countPublicMakeModels.mockRejectedValueOnce(new Error("db")).mockResolvedValue(PAIRS);
    countPublicSpecs.mockResolvedValue(SPECS);
    await expect(suggestSearches("toy", "en")).rejects.toThrow("db");
    await suggestSearches("toy", "en");
    await suggestSearches("kia", "en");
    expect(countPublicMakeModels).toHaveBeenCalledTimes(2);
    expect(countPublicSpecs).toHaveBeenCalledTimes(1);
  });
});
