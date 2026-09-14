import { describe, it, expect } from "vitest";
import { expandSearchTerm } from "@/lib/utils/search-aliases";
import enPlaces from "@/messages/en/places.json";
import arPlaces from "@/messages/ar/places.json";
import enAttributes from "@/messages/en/carAttributes.json";
import arAttributes from "@/messages/ar/carAttributes.json";

/**
 * Place names and brands are database values, not UI copy, so they are
 * translated by lookup at render while the stored English stays the thing
 * filters and search match on.
 *
 * The invariant that makes that safe: anything shown in Arabic must be
 * findable in Arabic. These lock it, because the failure is silent — the page
 * looks right and the search box quietly returns nothing.
 */

const GROUPS = [
  ["places.cities", enPlaces.cities, arPlaces.cities],
  ["places.regions", enPlaces.regions, arPlaces.regions],
  ["places.countries", enPlaces.countries, arPlaces.countries],
  ["carAttributes.make", enAttributes.make, arAttributes.make],
] as const;

describe("place and brand name maps", () => {
  it.each(GROUPS.map(([name]) => name))(
    "%s defines the same keys in both locales",
    (name) => {
      const [, en, ar] = GROUPS.find(([n]) => n === name)!;

      expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    }
  );

  it.each(GROUPS.map(([name]) => name))(
    "%s keeps the English map as an identity, so the key is the stored value",
    (name) => {
      const [, en] = GROUPS.find(([n]) => n === name)!;

      // If these ever diverged, the English page would show something other
      // than what the column holds, and the filter value would stop matching.
      for (const [key, value] of Object.entries(en)) {
        expect(value).toBe(key);
      }
    }
  );

  it.each(GROUPS.map(([name]) => name))(
    "%s actually translates into Arabic",
    (name) => {
      const [, en, ar] = GROUPS.find(([n]) => n === name)!;

      const untranslated = Object.keys(en).filter(
        (key) => (ar as Record<string, string>)[key] === key
      );

      expect(untranslated).toEqual([]);
    }
  );

  it("makes every Arabic display form searchable back to its stored value", () => {
    const unsearchable: string[] = [];

    for (const [name, en, ar] of GROUPS) {
      for (const key of Object.keys(en)) {
        const arabic = (ar as Record<string, string>)[key];

        if (!expandSearchTerm(arabic).includes(key)) {
          unsearchable.push(`${name}.${key} shown as "${arabic}"`);
        }
      }
    }

    expect(unsearchable).toEqual([]);
  });

  it("leaves a value it does not know untouched", () => {
    // Dealers type freely; an unmapped value must survive both paths intact
    // rather than vanishing or turning into a key path.
    expect(expandSearchTerm("Some Unlisted Town")).toEqual([
      "Some Unlisted Town",
    ]);
  });
});
