import { describe, it, expect } from "vitest";
import {
  EGYPT_CITIES,
  EGYPT_GOVERNORATES,
  findCity,
  findGovernorate,
} from "./egypt-locations";
import {
  cityName,
  governorateName,
  locationName,
  placeName,
} from "@/lib/utils/place-names";
import { expandSearchTerm } from "@/lib/utils/search-aliases";

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

  it("gives every governorate a unique ISO 3166-2:EG code", () => {
    const codes = EGYPT_GOVERNORATES.map((governorate) => governorate.code);

    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[A-Z]{1,3}$/);
  });

  it("gives every city a unique slug", () => {
    // Slugs are stored in Organization.city. A duplicate would silently move a
    // dealership to another governorate's city of the same name.
    const slugs = EGYPT_CITIES.map((city) => city.slug);
    const duplicates = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);

    expect(duplicates).toEqual([]);
  });

  it("uses url-safe slugs", () => {
    for (const city of EGYPT_CITIES) {
      expect(city.slug).toMatch(/^[a-z0-9-]+$/);
    }
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
      expect(row.en).not.toMatch(/[\u0600-\u06FF]/);
      expect(row.ar).toMatch(/[\u0600-\u06FF]/);
      expect(row.ar).not.toMatch(/[A-Za-z]/);
    }
  });

  it("looks a place up by what is stored", () => {
    expect(findGovernorate("C")?.en).toBe("Cairo");
    expect(findCity("6th-of-october")?.ar).toBe("مدينة السادس من أكتوبر");
    expect(findGovernorate("nope")).toBeUndefined();
    expect(findCity(null)).toBeUndefined();
  });
});

describe("resolving a stored place for display", () => {
  it("renders a code and a slug in either language", () => {
    expect(governorateName("C", "en")).toBe("Cairo");
    expect(governorateName("C", "ar")).toBe("القاهرة");
    expect(cityName("giza", "ar")).toBe("الجيزة");
    expect(cityName("sharm-el-sheikh", "ar")).toBe("شرم الشيخ");
  });

  it("still renders rows written before the change", () => {
    // These held display names from the old location API, so the fallback has
    // to recognise a name as well as a code.
    expect(governorateName("Cairo", "ar")).toBe("القاهرة");
    expect(cityName("Mansoura", "ar")).toBe("المنصورة");
    expect(cityName("El Mahalla El Kubra", "ar")).toBe("المحلة الكبرى");
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
      if (governorateName(governorate.ar, "ar") !== governorate.ar) {
        wrong.push(governorate.ar);
      }
    }

    expect(wrong).toEqual([]);
  });

  it("resolves the spellings actually present in the database", () => {
    // Taken from the live facet payload, which is what un-backfilled rows hold.
    expect(cityName("Al Maḩallah al Kubrá", "ar")).toBe("المحلة الكبرى");
    expect(cityName("Port Said", "ar")).toBe("بورسعيد");
    expect(governorateName("Alexandria Governorate", "ar")).toBe("الإسكندرية");
    expect(governorateName("Dakahlia", "ar")).toBe("الدقهلية");
  });

  it("translates the broad areas that are not governorates", () => {
    // Half the current rows describe an area rather than an administrative
    // unit. No code corresponds to them, so a backfill cannot resolve them
    // either — but they still have to read correctly in Arabic.
    expect(governorateName("Greater Cairo", "ar")).toBe("القاهرة الكبرى");
    expect(governorateName("Canal Zone", "ar")).toBe("منطقة القناة");
    expect(governorateName("Upper Egypt", "ar")).toBe("صعيد مصر");
    // English keeps what was written, since that is already English.
    expect(governorateName("Greater Cairo", "en")).toBe("Greater Cairo");
  });

  it("leaves a value it does not recognise exactly as typed", () => {
    expect(cityName("Some Village", "ar")).toBe("Some Village");
    expect(governorateName("Atlantis", "ar")).toBe("Atlantis");
    expect(cityName("", "ar")).toBe("");
  });

  it("resolves a place that could be a city or a governorate", () => {
    // Dealers fill the two fields inconsistently.
    expect(placeName("aswan", "ar")).toBe("أسوان");
    expect(placeName("ASN", "ar")).toBe("أسوان");
  });

  it("translates a composed location part by part", () => {
    expect(locationName("Cairo, Egypt", "ar")).toBe("القاهرة، مصر");
    expect(locationName("Cairo, Egypt", "en")).toBe("Cairo, Egypt");
    // An unmapped part survives intact rather than dropping out.
    expect(locationName("Nowhere, Egypt", "ar")).toBe("Nowhere، مصر");
  });
});

describe("searching for what is displayed", () => {
  it("finds the stored value from either language", () => {
    for (const city of EGYPT_CITIES) {
      expect(expandSearchTerm(city.en)).toContain(city.slug);
      expect(expandSearchTerm(city.ar)).toContain(city.slug);
    }
    for (const governorate of EGYPT_GOVERNORATES) {
      expect(expandSearchTerm(governorate.en)).toContain(governorate.code);
      expect(expandSearchTerm(governorate.ar)).toContain(governorate.code);
    }
  });
});
