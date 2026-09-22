import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { routing } from "@/i18n/routing";

/**
 * Structural guard on the message files.
 *
 * A missing key does not throw at build time — next-intl renders the key path
 * itself, so an untranslated string ships as "nav.browseCars" in the UI and
 * nobody notices until an Arabic reader does. With ~800 keys planned, that has
 * to be caught mechanically rather than by review.
 */

const MESSAGES_DIR = path.join(process.cwd(), "messages");

/** Flatten {a: {b: "x"}} to ["a.b"]. */
function keysOf(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keysOf(v, prefix ? `${prefix}.${k}` : k)
  );
}

function namespacesFor(locale: string): string[] {
  return fs
    .readdirSync(path.join(MESSAGES_DIR, locale))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

function load(locale: string, namespace: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, locale, `${namespace}.json`), "utf8")
  );
}

const [defaultLocale, ...otherLocales] = [
  routing.defaultLocale,
  ...routing.locales.filter((l) => l !== routing.defaultLocale),
];

describe("message files", () => {
  const baseNamespaces = namespacesFor(defaultLocale);

  it("defines at least one namespace", () => {
    expect(baseNamespaces.length).toBeGreaterThan(0);
  });

  for (const locale of otherLocales) {
    it(`${locale} has the same namespaces as ${defaultLocale}`, () => {
      expect(namespacesFor(locale).sort()).toEqual(baseNamespaces.sort());
    });

    for (const ns of baseNamespaces) {
      it(`${locale}/${ns}.json has the same keys as ${defaultLocale}`, () => {
        const base = keysOf(load(defaultLocale, ns)).sort();
        const other = keysOf(load(locale, ns)).sort();

        const missing = base.filter((k) => !other.includes(k));
        const extra = other.filter((k) => !base.includes(k));

        expect({ missing, extra }).toEqual({ missing: [], extra: [] });
      });
    }
  }

  for (const locale of routing.locales) {
    for (const ns of namespacesFor(locale)) {
      it(`${locale}/${ns}.json has no empty values`, () => {
        const flat = load(locale, ns);
        const empties = keysOf(flat).filter((k) => {
          const value = k
            .split(".")
            .reduce<unknown>(
              (acc, part) => (acc as Record<string, unknown>)?.[part],
              flat
            );
          return typeof value === "string" && value.trim() === "";
        });
        // An empty string renders as nothing at all, which is worse than an
        // untranslated fallback — the roadmap's rule is "fall back, never blank".
        expect(empties).toEqual([]);
      });
    }
  }

  it("ar does not accidentally contain the English source text", () => {
    // A copy-paste of the en file is the most common way a "translated"
    // namespace ships untranslated, and key-parity checks cannot see it.
    for (const ns of baseNamespaces) {
      const en = load("en", ns);
      const ar = load("ar", ns);
      expect(JSON.stringify(ar)).not.toEqual(JSON.stringify(en));
    }
  });
});
