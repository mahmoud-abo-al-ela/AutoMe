import { describe, it, expect, vi, beforeEach } from "vitest";

const { countPublicMakeModels } = vi.hoisted(() => ({ countPublicMakeModels: vi.fn() }));
vi.mock("@/lib/repositories/car", () => ({ countPublicMakeModels }));

import {
  MAX_SUGGESTIONS,
  matchSuggestions,
  resetSuggestionsForTests,
  suggestSearches,
} from "@/lib/services/car/search-suggestions";

const PAIRS = [
  { make: "Toyota", model: "Corolla", count: 4 },
  { make: "Toyota", model: "Camry", count: 2 },
  { make: "Toyota", model: "Yaris", count: 1 },
  { make: "Tesla", model: "Model 3", count: 1 },
  { make: "Kia", model: "Cerato", count: 3 },
  { make: "BMW", model: "X5", count: 2 },
];

const labels = (query: string, locale: "en" | "ar" = "en") => matchSuggestions(query, locale, PAIRS).map((s) => s.label);

beforeEach(() => {
  vi.resetAllMocks();
  resetSuggestionsForTests();
});

describe("matchSuggestions", () => {
  it("suggests the makes a prefix starts, with all their cars, the most first", () => {
    expect(matchSuggestions("t", "en", PAIRS).slice(0, 2)).toEqual([
      { kind: "make", label: "Toyota", count: 7, make: "Toyota" },
      { kind: "make", label: "Tesla", count: 1, make: "Tesla" },
    ]);
  });

  it("finds a make by its Arabic name, and labels it in the reader's language", () => {
    expect(labels("تو", "ar")[0]).toBe("تويوتا");
    expect(labels("تو", "en")[0]).toBe("Toyota");
  });

  it("follows a make with its models", () => {
    expect(labels("toyota")).toEqual(["Toyota", "Toyota Corolla", "Toyota Camry", "Toyota Yaris"]);
  });

  it("completes a model after its make, typed in either language", () => {
    expect(matchSuggestions("toyota cor", "en", PAIRS)).toEqual([
      { kind: "model", label: "Toyota Corolla", count: 4, make: "Toyota", search: "Corolla" },
    ]);
    // Beside its model a make keeps its English name, as a car's title does.
    expect(labels("كيا", "ar")).toEqual(["كيا", "Kia Cerato"]);
    expect(labels("كيا ce", "ar")).toEqual(["Kia Cerato"]);
  });

  it("finds a model on its own", () => {
    expect(labels("x")).toEqual(["BMW X5"]);
    expect(labels("cam")).toEqual(["Toyota Camry"]);
  });

  it("matches across Arabic spellings, as the search folds them", () => {
    expect(labels("هيونداى", "ar")).toEqual([]);
    expect(matchSuggestions("هيونداى", "ar", [{ make: "Hyundai", model: "Elantra", count: 2 }])[0]?.label).toBe("هيونداي");
  });

  it("stops at the limit", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ make: "Toyota", model: `Model ${i}`, count: 1 }));
    expect(matchSuggestions("toyota", "en", many)).toHaveLength(MAX_SUGGESTIONS);
  });

  it("suggests nothing for what has no searchable word", () => {
    expect(labels("؟؟ !!")).toEqual([]);
  });
});

describe("suggestSearches", () => {
  it("suggests no loose words: a word that names no make or model gets nothing", async () => {
    countPublicMakeModels.mockResolvedValue(PAIRS);
    expect(await suggestSearches("sunroof", "en")).toEqual([]);
  });

  it("asks nothing for what has no searchable word", async () => {
    expect(await suggestSearches("؟؟", "ar")).toEqual([]);
    expect(countPublicMakeModels).not.toHaveBeenCalled();
  });

  it("reads the make-and-model counts once a minute, and again after a failure", async () => {
    countPublicMakeModels.mockRejectedValueOnce(new Error("db")).mockResolvedValue(PAIRS);
    await expect(suggestSearches("toy", "en")).rejects.toThrow("db");
    await suggestSearches("toy", "en");
    await suggestSearches("kia", "en");
    expect(countPublicMakeModels).toHaveBeenCalledTimes(2);
  });
});
