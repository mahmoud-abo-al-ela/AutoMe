import { describe, it, expect } from "vitest";
import {
  EGYPT_CITIES,
  EGYPT_GOVERNORATES,
  citySlug,
  findCity,
  findGovernorate,
} from "./data";
import { cityName, countryName, governorateName, locationName, placeName } from "./names";
import { normalizePlaceName } from "./normalize";

/**
 * This dataset is the single source of truth for what a dealer can pick, what
 * gets stored, and how it renders in either language. These lock the
 * invariants that make that safe — most of which fail silently: a duplicate
 * slug quietly reassigns a dealership's city, and a missing Arabic name just
 * shows English on an Arabic page.
 */

describe("the Egypt location dataset", () => {
  it("covers all 27 governorates", () => {
    expect(EGYPT_GOVERNORATES).toHaveLength(27);
  });

  it("gives every governorate a unique code", () => {
    const codes = EGYPT_GOVERNORATES.map((governorate) => governorate.code);

    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2,4}$/);
  });

  it("derives every slug from the English name, without collisions", () => {
    // The slug is stored in Organization.city, so a collision would silently
    // move a dealership to a different place.
    const slugs = EGYPT_CITIES.map((city) => city.slug);

    for (const city of EGYPT_CITIES) {
      expect(city.slug).toBe(citySlug(city.en));
      expect(city.slug).toMatch(/^[a-z0-9-]+$/);
    }
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every governorate at least one city", () => {
    const empty = EGYPT_GOVERNORATES.filter(
      (governorate) => governorate.cities.length === 0
    ).map((governorate) => governorate.en);

    expect(empty).toEqual([]);
  });

  it("names everything in both scripts, and never mixes them", () => {
    const rows = [...EGYPT_GOVERNORATES, ...EGYPT_CITIES];

    for (const row of rows) {
      expect(row.en).not.toMatch(/[؀-ۿ]/);
      expect(row.ar).toMatch(/[؀-ۿ]/);
      expect(row.ar).not.toMatch(/[A-Za-z]/);
    }
  });

  it("looks a place up by what is stored", () => {
    expect(findGovernorate("CAI")?.en).toBe("Cairo");
    expect(findCity("6th-of-october")?.ar).toBe("6 أكتوبر");
    expect(findGovernorate("nope")).toBeUndefined();
    expect(findCity(null)).toBeUndefined();
  });
});

describe("normalizing a place name", () => {
  it("keeps Arabic, rather than reducing it to nothing", () => {
    // The previous normalizer stripped every non-ASCII character, so each
    // Arabic name folded to "" and was dropped from the index by the guard
    // that skips empty keys. Half of every index was dead.
    expect(normalizePlaceName("القاهرة")).not.toBe("");
    expect(normalizePlaceName("المعادي")).not.toBe("");
  });

  it("folds the alef and ta marbuta forms that are written interchangeably", () => {
    expect(normalizePlaceName("القاهره")).toBe(normalizePlaceName("القاهرة"));
    expect(normalizePlaceName("الاسكندرية")).toBe(
      normalizePlaceName("الإسكندرية")
    );
  });

  it("folds a slug onto the name it came from", () => {
    expect(normalizePlaceName("el-mahalla-el-kubra")).toBe(
      normalizePlaceName("El Mahalla El Kubra")
    );
  });

  it("folds the spellings the old location API wrote", () => {
    expect(normalizePlaceName("Alexandria Governorate")).toBe(
      normalizePlaceName("Alexandria")
    );
    expect(normalizePlaceName("Al Maḩallah al Kubrá")).toBe(
      normalizePlaceName("El Mahalla El Kubra")
    );
  });
});

describe("resolving a stored place for display", () => {
  it("renders a code and a slug in either language", () => {
    expect(governorateName("CAI", "en")).toBe("Cairo");
    expect(governorateName("CAI", "ar")).toBe("القاهرة");
    expect(cityName("giza-district", "ar")).toBe("الجيزة");
    expect(cityName("sharm-el-sheikh", "ar")).toBe("شرم الشيخ");
  });

  it("renders a name a dealer typed, in either script", () => {
    // Car.location is free text, so a name has to resolve as well as a key —
    // and Arabic input has to resolve too, which it did not before.
    expect(governorateName("Cairo", "ar")).toBe("القاهرة");
    expect(cityName("Mansoura", "ar")).toBe("المنصورة");
    expect(cityName("المعادي", "en")).toBe("Maadi");
    expect(governorateName("القاهرة", "en")).toBe("Cairo");
  });

  it("resolves every entry to itself, in both languages", () => {
    // The lookup normalises loosely — it folds diacritics, the definite
    // article and a trailing ta marbuta — so that live data spelled
    // "Al Maḩallah al Kubrá" finds "El Mahalla El Kubra". Loose matching can
    // merge two genuinely different places, which would silently render one as
    // the other, so every entry is checked against itself.
    const wrong: string[] = [];

    for (const city of EGYPT_CITIES) {
      if (cityName(city.en, "en") !== city.en) wrong.push(city.en);
      if (cityName(city.ar, "ar") !== city.ar) wrong.push(city.ar);
    }
    for (const governorate of EGYPT_GOVERNORATES) {
      if (governorateName(governorate.en, "en") !== governorate.en) {
        wrong.push(governorate.en);
      }
      if (governorateName(governorate.ar, "ar") !== governorate.ar) {
        wrong.push(governorate.ar);
      }
    }

    expect(wrong).toEqual([]);
  });

  it("resolves the loose spellings that reach the database", () => {
    expect(cityName("Al Maḩallah al Kubrá", "ar")).toBe("المحلة الكبرى");
    expect(cityName("Port Said", "ar")).toBe("بورسعيد");
    expect(governorateName("Alexandria Governorate", "ar")).toBe("الإسكندرية");
    expect(governorateName("Dakahlia", "ar")).toBe("الدقهلية");
  });

  it("leaves a value it does not recognise exactly as typed", () => {
    expect(cityName("Some Village", "ar")).toBe("Some Village");
    expect(governorateName("Atlantis", "ar")).toBe("Atlantis");
    expect(cityName("", "ar")).toBe("");
  });

  it("resolves a place that could be a city or a governorate", () => {
    // Dealers fill the two fields inconsistently.
    expect(placeName("Aswan", "ar")).toBe("أسوان");
    expect(placeName("ASN", "ar")).toBe("أسوان");
  });

  it("renders a country from its code, its name or its Arabic name", () => {
    expect(countryName("EG", "ar")).toBe("مصر");
    expect(countryName("Egypt", "ar")).toBe("مصر");
    expect(countryName("مصر", "en")).toBe("Egypt");
    expect(countryName("Kuwait", "ar")).toBe("الكويت");
  });

  it("translates a composed location part by part", () => {
    expect(locationName("Cairo, Egypt", "ar")).toBe("القاهرة، مصر");
    expect(locationName("Cairo, Egypt", "en")).toBe("Cairo, Egypt");
    // An unmapped part survives intact rather than dropping out.
    expect(locationName("Nowhere, Egypt", "ar")).toBe("Nowhere، مصر");
  });
});
