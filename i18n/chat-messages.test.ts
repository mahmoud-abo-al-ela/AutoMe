import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import enChat from "@/messages/en/chat.json";
import arChat from "@/messages/ar/chat.json";
import arStream from "@/i18n/stream-chat-ar.json";

/**
 * Chat is two translation problems in one file.
 *
 * The app's own copy around the chat — page headers, the channel previews, the
 * enquiry sidebar — lives in `messages/{en,ar}/chat.json` like every other
 * namespace. Stream Chat's UI copy does not: the library ships its own bundle
 * in eleven languages, none of them Arabic, keyed by the English sentence.
 * `stream-chat-ar.json` fills that in, and the risk there is the opposite of a
 * missing key: a key the library has renamed or dropped still parses, still
 * loads, and silently renders English forever.
 */

// Read off disk rather than imported: the package's `exports` map does not
// expose its translation files, and pulling the library's entry point into a
// node test drags the whole React bundle with it.
const enStream: Record<string, string> = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "node_modules/stream-chat-react/dist/i18n/en.json"),
    "utf8"
  )
);

type Flat = [string, string][];

const flatten = (obj: Record<string, unknown>, prefix = ""): Flat =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? flatten(value as Record<string, unknown>, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)] as [string, string]]
  );

/** i18next appends the plural category to the key; Arabic has six. */
const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];

const splitPlural = (key: string) => {
  const match = key.match(/^(.*)_(zero|one|two|few|many|other)$/);
  return match ? { base: match[1], category: match[2] } : null;
};

describe("chat messages", () => {
  it("defines the same keys in both locales", () => {
    expect(flatten(arChat).map(([k]) => k).sort()).toEqual(
      flatten(enChat).map(([k]) => k).sort()
    );
  });

  it("translates every key, bar the ones that carry no words", () => {
    // The unread cap is "{max}+" — the digits come from the numbering system
    // and the plus is not a word, so there is nothing here to translate.
    const NOT_LANGUAGE = new Set(["badge.overflow"]);

    const arabic = new Map(flatten(arChat));
    const untranslated = flatten(enChat)
      .filter(([key, value]) => !NOT_LANGUAGE.has(key) && arabic.get(key) === value)
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });
});

describe("the Stream Chat Arabic bundle", () => {
  it("only translates keys the library actually has", () => {
    // A key that no longer exists costs nothing at runtime and shows English
    // for as long as nobody re-reads the file, so it has to fail here.
    const unknown = Object.keys(arStream).filter((key) => {
      if (key in enStream) return false;
      // English declares two plural categories; Arabic needs six, so the
      // extra ones are matched against the family rather than the exact key.
      const plural = splitPlural(key);
      if (!plural) return true;
      return !(`${plural.base}_one` in enStream || `${plural.base}_other` in enStream);
    });

    expect(unknown).toEqual([]);
  });

  it("gives every plural all six Arabic categories", () => {
    // i18next picks the category by Intl.PluralRules. A family missing one
    // renders the bare key — "replyCount" — for exactly the counts that hit it.
    const families = new Set<string>();
    for (const key of Object.keys(arStream)) {
      const plural = splitPlural(key);
      if (plural) families.add(plural.base);
    }

    expect(families.size).toBeGreaterThan(0);
    for (const base of families) {
      for (const category of PLURAL_SUFFIXES) {
        expect(arStream, `missing ${base}_${category}`).toHaveProperty(
          `${base}_${category}`
        );
      }
    }
  });

  it("keeps every interpolation the English key declares", () => {
    // Stream interpolates with {{ name }}, optionally piped through a
    // formatter as {{ name | number }} — "|" being its format separator. A
    // dropped or misspelled name renders the placeholder as literal text in
    // the middle of a sentence.
    const placeholders = (text: string) =>
      [...text.matchAll(/\{\{\s*(\w+)\s*(?:\|[^}]*)?\}\}/g)]
        .map((match) => match[1])
        .sort();

    for (const [key, arabic] of Object.entries(arStream)) {
      const plural = splitPlural(key);
      const english = enStream[key] ?? enStream[`${plural?.base}_other`];
      if (!english) continue;

      // A plural form may legitimately drop the count — Arabic's dual says
      // "رسالتان", where the number is the word — so those are checked for
      // invented placeholders only. `_other` is the catch-all and must carry
      // the count, or most of the range renders without its number.
      const exact = !plural || plural.category === "other";

      if (exact) {
        expect(placeholders(arabic), `placeholders differ for ${key}`).toEqual(
          placeholders(english)
        );
      } else {
        const allowed = new Set(placeholders(english));
        expect(
          placeholders(arabic).filter((p) => !allowed.has(p)),
          `unknown placeholder in ${key}`
        ).toEqual([]);
      }
    }
  });
});
