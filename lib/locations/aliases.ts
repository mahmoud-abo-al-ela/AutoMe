import arCarAttributes from "@/messages/ar/carAttributes.json";
import { EGYPT_CITIES, EGYPT_GOVERNORATES } from "./data";
import { normalizePlaceName } from "./normalize";
import arPlaces from "@/messages/ar/places.json";
import enPlaces from "@/messages/en/places.json";

export interface SearchVariants {
  /** Canonical column values. Compare with equality. */
  exact: string[];
  /** Display spellings, the reader's own term first. Compare as text. */
  text: string[];
}

type Bucket = keyof SearchVariants;

const INDEX = new Map<string, SearchVariants>();
/** Every name the index knows, as displayed. */
const SURFACES = new Set<string>();

function add(surface: string, bucket: Bucket, value: string) {
  const key = normalizePlaceName(surface);
  if (!key) return;
  SURFACES.add(surface.trim());

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

for (const [english, arabic] of Object.entries(arCarAttributes.feature)) {
  if (english === arabic) continue;
  add(arabic, "text", english);
  add(english, "text", arabic);
}

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

export function knownNames(): string[] {
  return [...SURFACES];
}

/** True when the term maps to at least one stored value. */
export function hasAlias(term: string): boolean {
  const { exact, text } = expandSearchTerm(term);
  return exact.length > 0 || text.length > 1;
}
