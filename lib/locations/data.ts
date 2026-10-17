import { cities, governorates } from "egydata";

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
