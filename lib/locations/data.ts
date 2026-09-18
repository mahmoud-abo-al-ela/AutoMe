import { cities, governorates } from "egydata";

/**
 * Egypt's governorates and their districts, read from the `egydata` package.
 *
 * This is the single source of truth for what a dealer can pick, what gets
 * stored, and what can be translated — the dropdown, the display lookup and the
 * search aliases all read it, so a value that can be chosen is always a value
 * that can be rendered in both languages.
 *
 * ## What is stored
 *
 * `Organization.region` holds the governorate `code` and `Organization.city`
 * holds the city `slug`. Neither column holds a display name, so nothing has to
 * be re-spelled to be translated, and a dealer switching the site to Arabic
 * sees their own address change language.
 *
 * The slug is ours rather than egydata's numeric id on purpose: these values
 * end up in database rows and in shareable filter URLs, and a third-party
 * package's private numbering is not something to hand that job to. The
 * governorate code is egydata's, but it is a stable mnemonic ("CAI", "GIZ")
 * rather than an ordinal.
 */

export interface EgyptCity {
  /** Stored in `Organization.city`. See `citySlug`. */
  slug: string;
  en: string;
  ar: string;
}

export interface EgyptGovernorate {
  /** egydata's governorate code, stored in `Organization.region`. */
  code: string;
  en: string;
  ar: string;
  cities: readonly EgyptCity[];
}

export const EGYPT_COUNTRY_CODE = "EG";

export function citySlug(englishName: string): string {
  return englishName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const EGYPT_GOVERNORATES: readonly EgyptGovernorate[] = governorates
  .getAll()
  .map((governorate) => ({
    code: governorate.code,
    en: governorate.nameEn,
    ar: governorate.name,
    cities: cities.getByGovernorate(governorate.code).map((city) => ({
      slug: citySlug(city.nameEn),
      en: city.nameEn,
      ar: city.name,
    })),
  }));

/** Every city, flattened, with the governorate it belongs to. */
export const EGYPT_CITIES: readonly (EgyptCity & { governorate: string })[] =
  EGYPT_GOVERNORATES.flatMap((governorate) =>
    governorate.cities.map((entry) => ({
      ...entry,
      governorate: governorate.code,
    }))
  );

const GOVERNORATES_BY_CODE = new Map(
  EGYPT_GOVERNORATES.map((governorate) => [governorate.code, governorate])
);

const CITIES_BY_SLUG = new Map(EGYPT_CITIES.map((entry) => [entry.slug, entry]));

export function findGovernorate(code?: string | null) {
  return code ? GOVERNORATES_BY_CODE.get(code.trim()) : undefined;
}

export function findCity(slug?: string | null) {
  return slug ? CITIES_BY_SLUG.get(slug.trim()) : undefined;
}
