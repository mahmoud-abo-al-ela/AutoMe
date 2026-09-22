import { describe, it, expect } from "vitest";
import { buildSearchClause } from "./search-clause";
import { EGYPT_CITIES, EGYPT_GOVERNORATES } from "@/lib/locations";

/** Every `contains` value anywhere in the clause tree. */
function containsValues(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) containsValues(item, found);
    return found;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "contains" && typeof value === "string") found.push(value);
      else containsValues(value, found);
    }
  }
  return found;
}

/** Every field compared with `equals`. */
function equalsFields(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) equalsFields(item, found);
    return found;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (value && typeof value === "object" && "equals" in (value as object)) {
        found.push(key);
      } else {
        equalsFields(value, found);
      }
    }
  }
  return found;
}

describe("buildSearchClause", () => {
  it("returns nothing for an empty search", () => {
    expect(buildSearchClause("")).toBeNull();
    expect(buildSearchClause("   ")).toBeNull();
    expect(buildSearchClause(null)).toBeNull();
  });

  it("matches each word across the text fields", () => {
    const values = containsValues(buildSearchClause("cairo gallery"));

    expect(values).toContain("cairo");
    expect(values).toContain("gallery");
  });

  // The regression this file exists for. Letting a canonical value reach a
  // `contains` matched every dealership with a "c" anywhere in its name,
  // description or address — searching "القاهرة" returned eleven of them
  // instead of three. The clause now takes its text variants from a bucket
  // that cannot contain a code or a slug, so the invariant is checked
  // directly rather than through a length proxy.
  it("never substring-matches a canonical value", () => {
    const canonical = new Set([
      ...EGYPT_GOVERNORATES.map((governorate) => governorate.code),
      ...EGYPT_CITIES.map((city) => city.slug),
    ]);

    for (const term of ["القاهرة", "Cairo", "الجيزة", "Giza", "قنا", "Qena"]) {
      for (const value of containsValues(buildSearchClause(term))) {
        if (value === term) continue; // The reader's own words always stand.
        expect(canonical.has(value)).toBe(false);
      }
    }
  });

  it("compares the canonical columns by equality, not by substring", () => {
    const clause = buildSearchClause("القاهرة");

    expect(equalsFields(clause)).toContain("city");
    expect(equalsFields(clause)).toContain("region");
    // Those two must never appear as substring matches.
    const asText = JSON.stringify(clause).match(/"(city|region)":\{"contains"/);
    expect(asText).toBeNull();
  });

  it("resolves a place name to the value the column holds", () => {
    const clause = JSON.stringify(buildSearchClause("الجيزة"));

    expect(clause).toContain("giza-district");
    expect(clause).toContain("GIZ");
  });

  it("resolves a multi-word place name as a unit", () => {
    // No single word of this matches the stored slug.
    const clause = JSON.stringify(buildSearchClause("El Mahalla El Kubra"));

    expect(clause).toContain("el-mahalla-el-kubra");
  });

  it("keeps a plain search working when nothing resolves", () => {
    const clause = buildSearchClause("Alexandria Motors");
    const values = containsValues(clause);

    expect(values).toContain("Alexandria Motors".split(" ")[1]);
  });
});
