/**
 * Merge egydata's district and city names into lib/constants/egypt-locations.
 *
 * The curated list owns the identifiers — ISO 3166-2 governorate codes and our
 * own city slugs — because those end up in database columns and saved URLs,
 * and a third-party package's private numbering is not something to hand that
 * job to. egydata owns nothing here; it is a source of *names*, and a good
 * one: where the two lists overlapped, their Arabic agreed on 113 of 116
 * entries, and it carries roughly two hundred districts the curated list did
 * not, including التجمع الخامس and المقطم.
 *
 * Rules:
 *   - An entry already in the file is never touched. Its slug may be stored in
 *     a row somewhere, and its Arabic has been checked against ISO 3166-2 and
 *     Wikidata.
 *   - A new entry is appended to its governorate, with a slug derived from the
 *     English name and made unique.
 *   - Where the two disagree on the Arabic for the same place, the curated
 *     value stays and the difference is printed, rather than silently
 *     overwritten either way.
 *
 * Run:
 *   npx tsx scripts/merge-egydata-locations.ts          # report only
 *   npx tsx scripts/merge-egydata-locations.ts --write  # rewrite the file
 */

import fs from "node:fs";
import { cities, governorates } from "egydata";
import { EGYPT_GOVERNORATES } from "@/lib/constants/egypt-locations";

/**
 * ISO 3166-2:EG code -> egydata's own governorate code.
 *
 * Lives here rather than in the app: it is needed only to line the two lists
 * up at merge time. The app stores ISO codes and never sees egydata's.
 *
 * All 27 pair up by English name except Matrouh, which ISO spells "Matrouh"
 * and egydata "Matruh".
 */
const ISO_3166_2_TO_EGYDATA: Record<string, string> = {
  C: "CAI",
  ALX: "ALX",
  GZ: "GIZ",
  PTS: "PTS",
  SUZ: "SUZ",
  DK: "DKH",
  SHR: "SHR",
  KB: "QLB",
  KFS: "KFS",
  GH: "GHR",
  MNF: "MNF",
  BH: "BHR",
  IS: "ISM",
  DT: "DMT",
  FYM: "FYM",
  BNS: "BNS",
  MN: "MNY",
  AST: "AST",
  SHG: "SHG",
  KN: "QNA",
  LX: "LXR",
  ASN: "ASN",
  MT: "MTR",
  BA: "RED",
  WAD: "WAD",
  SIN: "SIN",
  JS: "SIS",
};

const WRITE = process.argv.includes("--write");
const FILE = "lib/constants/egypt-locations.ts";

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Loose enough to see through spelling and the definite article. */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ ]/g, " ")
    .replace(/\b(al|el)\b/g, " ")
    .replace(/^ال/, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const existingSlugs = new Set(
  EGYPT_GOVERNORATES.flatMap((g) => g.cities.map((c) => c.slug))
);

function uniqueSlug(name: string, governorateCode: string) {
  const base = slugify(name);
  if (!existingSlugs.has(base)) return base;
  const scoped = `${base}-${governorateCode.toLowerCase()}`;
  if (!existingSlugs.has(scoped)) return scoped;
  let n = 2;
  while (existingSlugs.has(`${scoped}-${n}`)) n++;
  return `${scoped}-${n}`;
}

const additions: { iso: string; slug: string; en: string; ar: string }[] = [];
const disagreements: string[] = [];
let alreadyPresent = 0;

for (const governorate of EGYPT_GOVERNORATES) {
  const egydataCode = ISO_3166_2_TO_EGYDATA[governorate.code];
  if (!egydataCode) {
    console.log(`! no egydata code for ${governorate.code} ${governorate.en}`);
    continue;
  }

  const known = new Map<string, { en: string; ar: string }>();
  for (const city of governorate.cities) {
    known.set(fold(city.en), city);
    known.set(fold(city.ar), city);
  }

  for (const incoming of cities.getByGovernorate(egydataCode)) {
    const match =
      known.get(fold(incoming.nameEn)) ?? known.get(fold(incoming.name));

    if (match) {
      alreadyPresent++;
      if (match.ar !== incoming.name) {
        disagreements.push(
          `  ${match.en.padEnd(26)} ours: ${match.ar.padEnd(22)} egydata: ${incoming.name}`
        );
      }
      continue;
    }

    const slug = uniqueSlug(incoming.nameEn, governorate.code);
    existingSlugs.add(slug);
    additions.push({
      iso: governorate.code,
      slug,
      en: incoming.nameEn,
      ar: incoming.name,
    });
  }
}

console.log(`egydata governorates:   ${governorates.getAll().length}`);
console.log(`already in the file:    ${alreadyPresent}`);
console.log(`to add:                 ${additions.length}`);
console.log(`arabic disagreements:   ${disagreements.length} (ours kept)\n`);

if (disagreements.length) {
  console.log("kept ours, for the record:");
  console.log(disagreements.join("\n"));
  console.log();
}

const byGovernorate = new Map<string, typeof additions>();
for (const addition of additions) {
  const list = byGovernorate.get(addition.iso) ?? [];
  list.push(addition);
  byGovernorate.set(addition.iso, list);
}

for (const [iso, list] of byGovernorate) {
  const governorate = EGYPT_GOVERNORATES.find((g) => g.code === iso);
  console.log(`  ${iso} ${governorate?.en} (+${list.length})`);
  for (const entry of list) console.log(`      ${entry.en} / ${entry.ar}`);
}

if (!WRITE) {
  console.log("\nReport only. Re-run with --write to update the file.");
  process.exit(0);
}

// Splice each governorate's new cities in before its closing "],".
let source = fs.readFileSync(FILE, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";
if (eol === "\r\n") source = source.replace(/\r\n/g, "\n");

for (const [iso, list] of byGovernorate) {
  const anchor = `    code: "${iso}",`;
  const start = source.indexOf(anchor);
  if (start < 0) throw new Error(`governorate block not found: ${iso}`);

  const citiesEnd = source.indexOf("\n    ],", start);
  if (citiesEnd < 0) throw new Error(`cities block not closed: ${iso}`);

  const lines = list
    .map((e) => `      city("${e.slug}", "${e.en}", "${e.ar}"),`)
    .join("\n");

  source = source.slice(0, citiesEnd) + "\n" + lines + source.slice(citiesEnd);
}

fs.writeFileSync(FILE, eol === "\r\n" ? source.replace(/\n/g, "\r\n") : source, "utf8");
console.log(`\nAdded ${additions.length} cities to ${FILE}.`);
