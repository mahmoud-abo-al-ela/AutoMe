import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import en from "@/messages/en/dealerships.json";
import ar from "@/messages/ar/dealerships.json";

/**
 * Message-shape checks for the dealerships namespace.
 *
 * These exist because the surface is rendered entirely client-side, so an
 * unfilled placeholder or a missing Arabic plural form reaches the page as
 * visible text rather than as an error anything would catch.
 */

const LOCALES = { en, ar } as const;

type Flat = [string, string][];

const flatten = (obj: Record<string, unknown>, prefix = ""): Flat =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)] as [string, string]]
  );

describe("dealerships messages", () => {
  it("defines the same keys in both locales", () => {
    const enKeys = flatten(en).map(([k]) => k).sort();
    const arKeys = flatten(ar).map(([k]) => k).sort();

    expect(arKeys).toEqual(enKeys);
  });

  it("translates every key, bar the pure-placeholder ones", () => {
    // These carry no words at all, so being identical is correct.
    const PLACEHOLDER_ONLY = new Set([
      "reviews.distributionRow",
      "reviews.form.counter",
    ]);

    const untranslated = flatten(en)
      .filter(([key, value]) => {
        if (PLACEHOLDER_ONLY.has(key)) return false;
        const arValue = flatten(ar).find(([k]) => k === key)?.[1];
        return arValue === value;
      })
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  // Counts chosen to hit every Arabic plural category: zero, one, two, few
  // (3-10), many (11-99) and other (100+).
  const COUNTS = [0, 1, 2, 3, 10, 11, 25, 99, 100, 101];

  it.each(["en", "ar"] as const)(
    "fills every placeholder in %s plurals, at every count",
    (locale) => {
      // next-intl types keys as a literal union; this walks them at runtime,
      // so the translator is widened to accept a plain string.
      const t = createTranslator({
        locale,
        messages: { dealerships: LOCALES[locale] },
        namespace: "dealerships",
      }) as unknown as (
        key: string,
        values?: Record<string, string | number>
      ) => string;

      const unfilled: string[] = [];

      for (const [key, template] of flatten(LOCALES[locale])) {
        if (!template.includes("plural")) continue;

        for (const count of COUNTS) {
          const rendered = t(key, {
            count,
            value: "N",
            cityCount: count,
            cityValue: "C",
            name: "NAME",
          });

          // A missing argument leaves the braces in the output rather than
          // throwing, so this is the only signal.
          if (rendered.includes("{") || rendered.includes("}")) {
            unfilled.push(`${key} @${count}: ${rendered}`);
          }
        }
      }

      expect(unfilled).toEqual([]);
    }
  );

  it("uses {value} rather than ICU # for plural counts", () => {
    // `#` formats with the bare routing locale, which gives Western digits in
    // Arabic while every other number on the page uses Eastern ones. See
    // lib/utils/intl-locale.
    const withHash = (["en", "ar"] as const).flatMap((locale) =>
      flatten(LOCALES[locale])
        .filter(([, value]) => value.includes("#"))
        .map(([key]) => `${locale}:${key}`)
    );

    expect(withHash).toEqual([]);
  });

  it("gives Arabic all six plural categories wherever English has two", () => {
    const REQUIRED = ["one", "two", "few", "many", "other"];

    const missing = flatten(ar)
      .filter(([, value]) => value.includes("plural"))
      .flatMap(([key, value]) =>
        REQUIRED.filter((form) => !value.includes(`${form} {`)).map(
          (form) => `${key} missing "${form}"`
        )
      );

    expect(missing).toEqual([]);
  });
});
