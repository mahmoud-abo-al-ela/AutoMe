import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Clerk's redirect props are the one place a URL escapes next-intl.
 *
 * Everything else navigates through `@/i18n/navigation`, which keeps the locale
 * prefix. These props are plain strings Clerk navigates to itself, so a literal
 * like "/auth-redirect" is a 308 to the default locale — which is how signing in
 * on an Arabic page dropped the reader into English for the rest of the session.
 *
 * The failure is silent: nothing errors, the destination is simply the wrong
 * language. So the rule is enforced by shape rather than by review — these props
 * must always be an expression carrying the locale, never a string literal.
 */

/**
 * A literal is written prop="…"; a locale-carrying expression is prop={…}.
 *
 * Deliberately a regex literal rather than one built from a list of prop names:
 * inside a template string `\b` is a backspace character rather than a word
 * boundary, so the assembled pattern matches nothing and the test passes on
 * every input. It did, until a deliberately reintroduced bug failed to trip it.
 */
const REDIRECT_PROP_LITERAL =
  /\b(forceRedirectUrl|fallbackRedirectUrl|afterSignInUrl|afterSignUpUrl|afterSignOutUrl|signInUrl|signUpUrl)\s*=\s*"/g;

/** `signOut({ redirectUrl: "/" })` is the same bug wearing a different shape. */
const SIGN_OUT_LITERAL = /redirectUrl:\s*"([^"]*)"/g;

const SOURCE_ROOTS = ["app", "components", "hooks"];

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      sourceFiles(full, found);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
      found.push(full);
    }
  }
  return found;
}

const files = SOURCE_ROOTS.filter((dir) => fs.existsSync(dir)).flatMap((dir) =>
  sourceFiles(dir)
);

const offendersFor = (pattern: RegExp) => {
  const offenders: string[] = [];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      offenders.push(`${file}:${line} ${match[0].trim()}`);
    }
  }

  return offenders;
};

describe("Clerk redirect targets", () => {
  it("scans a non-trivial number of files", () => {
    // Guards the guard: a broken walk would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(50);
  });

  it("matches a hardcoded prop when one is present", () => {
    // Guards the guard again, this time on the pattern rather than the walk.
    // A pattern that cannot match is indistinguishable from a clean codebase.
    const sample = '<SignInButton forceRedirectUrl="/auth-redirect">';

    expect(sample.match(REDIRECT_PROP_LITERAL)).not.toBeNull();
    expect('signOut({ redirectUrl: "/" })'.match(SIGN_OUT_LITERAL)).not.toBeNull();
  });

  it("never hardcodes a redirect prop as a string literal", () => {
    expect(offendersFor(REDIRECT_PROP_LITERAL)).toEqual([]);
  });

  it("never signs out to a hardcoded path", () => {
    expect(offendersFor(SIGN_OUT_LITERAL)).toEqual([]);
  });
});
