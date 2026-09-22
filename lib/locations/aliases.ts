import arCarAttributes from "@/messages/ar/carAttributes.json";
import { EGYPT_CITIES, EGYPT_GOVERNORATES } from "./data";
import { normalizePlaceName } from "./normalize";
import arPlaces from "@/messages/ar/places.json";
import enPlaces from "@/messages/en/places.json";

/**
 * Lets an Arabic reader search for what they can see.
 *
 * Place names and brands are stored as English values, so once the UI started
 * showing "القاهرة" a reader who typed it back got nothing — the word appears
 * nowhere in the data. The fix is to expand the query to the values the columns
 * actually hold before it reaches the database.
 *
 * ## Two buckets, because there are two kinds of column
 *
 * A term expands into values that must be compared by **equality** against a
 * canonical column (`Organization.region` holds "CAI", `Organization.city`
 * holds "maadi") and values that must be compared by **substring or prefix**
 * against free text (`Car.description`, `Car.location`, a dealership address).
 *
 * Returning one flat list and leaving callers to work out which is which is
 * what the previous version did, and it cost two heuristics — a length floor
 * and a code-set membership check — in three separate files, plus the bug they
 * were patching: a governorate code reaching a `contains` matched nearly every
 * row. Splitting them at the source means a caller cannot get it wrong, and the
 * heuristics are gone.
 *
 * The index is derived from the same message files and dataset the UI renders
 * from, so the two cannot drift: anything displayed in Arabic is searchable in
 * Arabic by construction.
 */

export interface SearchVariants {
  /** Canonical column values. Compare with equality. */
  exact: string[];
  /** Display spellings, the reader's own term first. Compare as text. */
  text: string[];
}

type Bucket = keyof SearchVariants;

const INDEX = new Map<string, SearchVariants>();

function add(surface: string, bucket: Bucket, value: string) {
  const key = normalizePlaceName(surface);
  if (!key) return;

  let entry = INDEX.get(key);
  if (!entry) {
    entry = { exact: [], text: [] };
    INDEX.set(key, entry);
  }
  if (!entry[bucket].includes(value)) entry[bucket].push(value);
}

// A place is reachable by either spelling, and expands to the code or slug its
// own column holds plus the English name. The English name is what turns up in
// the free-text columns — an address or a description mentioning Cairo — which
// a code can never match, since codes are only ever compared by equality.
for (const governorate of EGYPT_GOVERNORATES) {
  for (const surface of [governorate.en, governorate.ar]) {
    add(surface, "exact", governorate.code);
    add(surface, "text", governorate.en);
  }
}

for (const city of EGYPT_CITIES) {
  for (const surface of [city.en, city.ar]) {
    add(surface, "exact", city.slug);
    add(surface, "text", city.en);
  }
}

// Countries appear only inside free text ("Cairo, Egypt"), so they are text on
// both sides: there is no country column a search filters on.
for (const [key, english] of Object.entries(enPlaces.countries)) {
  const arabic = arPlaces.countries[key as keyof typeof arPlaces.countries];
  for (const surface of [english, arabic]) add(surface, "text", english);
}

// Car attributes are stored as their English value in a free-text column, so
// only the Arabic display form needs widening.
const attributeGroups: Record<string, string>[] = [
  arCarAttributes.make,
  arCarAttributes.fuel,
  arCarAttributes.body,
  arCarAttributes.transmission,
  arCarAttributes.color,
];

for (const group of attributeGroups) {
  for (const [english, arabic] of Object.entries(group)) {
    add(arabic, "text", english);
  }
}

/**
 * The search term, plus every stored value it stands for.
 *
 * `text` always leads with the reader's own term: it may be a dealership name,
 * an address or a model, none of which this module knows about.
 */
export function expandSearchTerm(term: string): SearchVariants {
  const trimmed = term?.trim();
  if (!trimmed) return { exact: [], text: [] };

  const found = INDEX.get(normalizePlaceName(trimmed));
  if (!found) return { exact: [], text: [trimmed] };

  return {
    exact: [...found.exact],
    text: [trimmed, ...found.text.filter((value) => value !== trimmed)],
  };
}

/** The variants safe to feed a substring or prefix matcher. */
export function expandSearchTermForText(term: string): string[] {
  return expandSearchTerm(term).text;
}

/** True when the term maps to at least one stored value. */
export function hasAlias(term: string): boolean {
  const { exact, text } = expandSearchTerm(term);
  return exact.length > 0 || text.length > 1;
}
