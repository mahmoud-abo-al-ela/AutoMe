import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { returnLocale } from "@/lib/utils/return-locale";

describe("returnLocale", () => {
  it("keeps one of our locales and falls back to the default for anything else", () => {
    expect(returnLocale("ar")).toBe("ar");
    expect(returnLocale("en")).toBe("en");
    expect(returnLocale("fr")).toBe("en");
    expect(returnLocale("ar/../x")).toBe("en");
    expect(returnLocale(undefined)).toBe("en");
    expect(returnLocale(42)).toBe("en");
  });
});

describe("Server Actions", () => {
  // next-intl's getLocale() (and getTranslations() without a locale) read
  // Next's root params, which throw inside a Server Action in production:
  // every billing checkout failed with it. Unit tests mock past it, so this
  // keeps it out of actions/ by reading the source.
  it("never read the request locale through next-intl", () => {
    const dir = path.join(process.cwd(), "actions");
    const offenders = readdirSync(dir)
      .filter((file) => /\.(ts|tsx|js)$/.test(file) && !file.includes(".test."))
      .filter((file) => {
        const source = readFileSync(path.join(dir, file), "utf8");
        return /\bgetLocale\s*\(/.test(source) || /getTranslations\s*\(\s*["'`]/.test(source);
      });
    expect(offenders).toEqual([]);
  });
});
