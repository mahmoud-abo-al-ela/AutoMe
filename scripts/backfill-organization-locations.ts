/**
 * Backfill `Organization.region` and `Organization.city` to canonical values.
 *
 * Both columns used to hold display names supplied by an external location API
 * — "Cairo", "Al Manşūrah", "Kafr El-Sheikh". They now hold a governorate code
 * and a city slug from lib/constants/egypt-locations, so that a stored value
 * carries no language of its own.
 *
 * Reading still works either way: `lib/utils/place-names` falls back from code
 * to display name. This exists so that filtering, faceting and search operate
 * on one value per place rather than on however many spellings accumulated.
 *
 * Run:
 *   npx tsx scripts/backfill-organization-locations.ts          # dry run
 *   npx tsx scripts/backfill-organization-locations.ts --apply  # write
 *
 * A dry run is the default deliberately: this rewrites columns that filters
 * and saved URLs point at, and the mapping is by name, which is exactly the
 * kind of thing worth reading before it runs.
 */

import { db } from "@/lib/prisma";
import {
  EGYPT_CITIES,
  EGYPT_GOVERNORATES,
} from "@/lib/constants/egypt-locations";

const APPLY = process.argv.includes("--apply");

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['`‘’ʻʼ-]/g, " ")
    .replace(/[^a-z0-9؀-ۿ ]/g, " ")
    .replace(/\b(al|el)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Display name (either language, loosely spelled) → canonical value. */
function buildLookup<T>(
  rows: readonly T[],
  canonical: (row: T) => string,
  surfaces: (row: T) => string[]
) {
  const byCanonical = new Set(rows.map(canonical));
  const byName = new Map<string, string>();

  for (const row of rows) {
    for (const surface of surfaces(row)) {
      const key = normalize(surface);
      if (key && !byName.has(key)) byName.set(key, canonical(row));
    }
  }

  return (value: string | null | undefined) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (byCanonical.has(trimmed)) return null; // already canonical
    return byName.get(normalize(trimmed)) ?? undefined; // undefined = no match
  };
}

const resolveRegion = buildLookup(
  EGYPT_GOVERNORATES,
  (row) => row.code,
  (row) => [row.en, row.ar]
);

const resolveCity = buildLookup(
  EGYPT_CITIES,
  (row) => row.slug,
  (row) => [row.en, row.ar]
);

async function main() {
  const organizations = await db.organization.findMany({
    select: { id: true, name: true, city: true, region: true, country: true },
  });

  let unchanged = 0;
  const updates: {
    id: string;
    name: string;
    data: { city?: string; region?: string; country?: string };
    before: string;
  }[] = [];
  const unmatched: string[] = [];

  for (const organization of organizations) {
    const data: { city?: string; region?: string; country?: string } = {};

    const region = resolveRegion(organization.region);
    if (region) data.region = region;
    if (region === undefined && organization.region) {
      unmatched.push(`region "${organization.region}"  (${organization.name})`);
    }

    const city = resolveCity(organization.city);
    if (city) data.city = city;
    if (city === undefined && organization.city) {
      unmatched.push(`city   "${organization.city}"  (${organization.name})`);
    }

    // The column is nullable and onboarding only recently began setting it.
    if (!organization.country) data.country = "EG";

    if (Object.keys(data).length === 0) {
      unchanged++;
      continue;
    }

    updates.push({
      id: organization.id,
      name: organization.name,
      data,
      before: `${organization.region ?? "—"} / ${organization.city ?? "—"}`,
    });
  }

  console.log(`organizations:      ${organizations.length}`);
  console.log(`already canonical:  ${unchanged}`);
  console.log(`to update:          ${updates.length}`);
  console.log(`unmatched values:   ${unmatched.length}\n`);

  for (const update of updates) {
    const after = `${update.data.region ?? "="} / ${update.data.city ?? "="}`;
    console.log(`  ${update.name.padEnd(28)} ${update.before.padEnd(34)} -> ${after}`);
  }

  if (unmatched.length) {
    // Left exactly as they are: place-names falls back to the raw value, so an
    // unrecognised place still renders. Worth adding to the dataset if it is
    // somewhere dealerships actually are.
    console.log("\nnot in the dataset, left untouched:");
    for (const entry of [...new Set(unmatched)]) console.log(`  ${entry}`);
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write these changes.");
    return;
  }

  for (const update of updates) {
    await db.organization.update({ where: { id: update.id }, data: update.data });
  }
  console.log(`\nUpdated ${updates.length} organization(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
