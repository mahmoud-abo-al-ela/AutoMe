import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));

const { revalidateLocalized, revalidateRouteTree } = await import("./revalidate");

/**
 * A revalidation that names no real page fails silently: Next just finds
 * nothing to refresh. That is how every call in actions/ went dead when the
 * locale prefix arrived, and how /admin/... paths outlived the routes they
 * named. So these check the paths against the route tree on disk.
 */

const ROOT = process.cwd();
const LOCALE_DIR = path.join(ROOT, "app", "[locale]");

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(full);
    return /\.(ts|tsx|js)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });

const callers = [...sourceFiles(path.join(ROOT, "actions")), ...sourceFiles(path.join(ROOT, "lib"))];

/** The string literal (or template) passed to `fn(...)`, `${…}` made a placeholder. */
const argumentsOf = (fn: string) =>
  callers.flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    return [...source.matchAll(new RegExp(`\\b${fn}\\(\\s*(["'\`])(.*?)\\1`, "g"))].map(
      (m) => ({
        file: path.relative(ROOT, file),
        path: m[2].replace(/\$\{[^}]+\}/g, ":param"),
      })
    );
  });

const isGroup = (name: string) => name.startsWith("(") && name.endsWith(")");
const isDynamic = (name: string) => name.startsWith("[") && name.endsWith("]");
const subdirs = (dir: string) =>
  fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

/** Does a page exist for these URL segments under `dir`? Route groups are transparent. */
function hasPage(dir: string, segments: string[]): boolean {
  if (segments.length === 0 && fs.existsSync(path.join(dir, "page.tsx"))) return true;
  return subdirs(dir).some((name) => {
    if (isGroup(name)) return hasPage(path.join(dir, name), segments);
    if (segments.length === 0) return false;
    const [head, ...rest] = segments;
    const matches = head === ":param" ? isDynamic(name) : name === head;
    return matches && hasPage(path.join(dir, name), rest);
  });
}

describe("revalidation helpers", () => {
  beforeEach(() => revalidatePath.mockClear());

  it("prefixes a page with every locale", () => {
    revalidateLocalized("/cars");
    expect(revalidatePath.mock.calls).toEqual([["/en/cars"], ["/ar/cars"]]);
  });

  it("maps the home page to the bare locale, not a trailing slash", () => {
    revalidateLocalized("/");
    expect(revalidatePath.mock.calls).toEqual([["/en"], ["/ar"]]);
  });

  it("refreshes a route tree as a layout", () => {
    revalidateRouteTree("/[locale]/(site)/cars");
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(site)/cars", "layout");
  });
});

describe("revalidation call sites", () => {
  it("never call revalidatePath directly", () => {
    // Direct calls bypass the locale prefix; the helpers are the one place it
    // is added.
    const direct = callers
      .filter((file) => !file.endsWith(path.join("utils", "revalidate.ts")))
      .filter((file) => /\brevalidatePath\(/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));

    expect(direct).toEqual([]);
  });

  it("name pages that exist", () => {
    const calls = argumentsOf("revalidateLocalized");
    expect(calls.length).toBeGreaterThan(0);

    const missing = calls
      .filter(({ path: url }) => !hasPage(LOCALE_DIR, url.split("/").filter(Boolean)))
      .map(({ file, path: url }) => `${file}: ${url}`);

    expect(missing).toEqual([]);
  });

  it("name route-tree folders that exist", () => {
    const calls = argumentsOf("revalidateRouteTree");
    expect(calls.length).toBeGreaterThan(0);

    const missing = calls
      .filter(({ path: route }) => !fs.existsSync(path.join(ROOT, "app", ...route.split("/"))))
      .map(({ file, path: route }) => `${file}: ${route}`);

    expect(missing).toEqual([]);
  });
});
