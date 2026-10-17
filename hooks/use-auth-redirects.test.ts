import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

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

// Read once: three checks re-reading every file from disk ran past the
// 5 s test timeout when the whole suite was loading the machine.
const sources = files.map((file) => ({ file, source: fs.readFileSync(file, "utf8") }));

const offendersFor = (pattern: RegExp) => {
  const offenders: string[] = [];

  for (const { file, source } of sources) {
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

const MESSAGES_BY_CAR = /\/messages\?carId=/g;

describe("chat entry points", () => {
  it("matches the old path when one is present", () => {
    expect("router.push(`/messages?carId=${car.id}`)".match(MESSAGES_BY_CAR)).not.toBeNull();
  });

  it("never send a buyer to /messages?carId= — it had no way back after sign-in", () => {
    expect(offendersFor(MESSAGES_BY_CAR)).toEqual([]);
  });
});
