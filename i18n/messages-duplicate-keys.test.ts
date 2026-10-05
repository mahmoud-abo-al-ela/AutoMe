import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * A key written twice in one object is not a JSON error: the parser keeps the
 * last one and drops the first without a word. Every other message test reads
 * the parsed object, so it never sees the lost copy. This one reads the text.
 *
 * It has happened: `superAdmin.organizations.form.basic.description` was both
 * a card subtitle and a field label, and the subtitle rendered "Description".
 */

const MESSAGES = path.join(process.cwd(), "messages");

/** Dotted paths of keys that repeat within the same object. */
function duplicateKeys(raw: string): string[] {
  const duplicates: string[] = [];
  const scopes: Set<string>[] = [new Set()];
  const trail: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const key = /^\s*"((?:[^"\\]|\\.)+)"\s*:\s*(\{)?/.exec(line);
    if (key) {
      const scope = scopes[scopes.length - 1];
      if (scope.has(key[1])) duplicates.push([...trail, key[1]].join("."));
      scope.add(key[1]);
      if (key[2] && !/\}\s*,?\s*$/.test(line)) {
        scopes.push(new Set());
        trail.push(key[1]);
      }
    } else if (/^\s*\}\s*,?\s*$/.test(line)) {
      scopes.pop();
      trail.pop();
    }
  }
  return duplicates;
}

describe("message files", () => {
  const files = fs
    .readdirSync(MESSAGES)
    .flatMap((locale) =>
      fs.readdirSync(path.join(MESSAGES, locale)).map((file) => path.join(locale, file))
    )
    .filter((file) => file.endsWith(".json"));

  it("finds the message files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s has no key written twice", (file) => {
    const raw = fs.readFileSync(path.join(MESSAGES, file), "utf8");
    expect(duplicateKeys(raw)).toEqual([]);
  });

  it("would catch one", () => {
    expect(duplicateKeys('{\n  "a": {\n    "b": "1",\n    "b": "2"\n  }\n}')).toEqual(["a.b"]);
  });
});
