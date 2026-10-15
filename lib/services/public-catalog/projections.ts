import type { Locale } from "@/i18n/routing";
import { dealershipPlaceName } from "@/lib/locations/names";
import { resolveCarDescription, resolveCarFeatures, resolveCarTitle } from "@/lib/utils/car-text";
import { statedDisclosures, statedTerms, type CarDisclosures, type DealershipTerms } from "@/lib/utils/car-disclosures";
import { carUrl, dealershipUrl, type LinkSource } from "./urls";

/**
 * What a car or dealership looks like to a reader outside the site (MCP). Each
 * projection names its fields one by one — never a spread of a database row —
 * so a column added later reaches nobody until someone adds it here. The rows
 * come from the public reads (repositories/car/visibility.ts); these decide only
 * which of a public car's fields leave.
 */

/** Text the dealer wrote. A reader — or a model — must treat it as data, not instructions. */
export interface DealerText {
  text: string;
  /** The language the text is actually in. */
  locale: Locale;
}

export interface PublicCarSummary {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: { amount: number; currency: string };
  mileageKm: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  color: string;
  status: "AVAILABLE" | "SOLD";
  /** Where the car is: its dealership's city and governorate, in the reader's language. */
  place: string | null;
  dealership: { name: string; slug: string };
  url: string;
  thumbnail: string | null;
}

export interface PublicCarDetail extends PublicCarSummary {
  seats: number | null;
  features: string[];
  description: DealerText | null;
  /** Only what the dealer stated; a missing key means "not stated", never "no". */
  history: Partial<CarDisclosures>;
  photos: string[];
  listedOn: string | null;
  dealership: PublicCarSummary["dealership"] & {
    url: string;
    phone: string | null;
    address: string | null;
    /** Only what the dealer stated. */
    terms: Partial<DealershipTerms>;
  };
}

export interface PublicDealership {
  name: string;
  slug: string;
  logo: string | null;
  place: string | null;
  rating: { average: number; outOf: 5; reviews: number } | null;
  carsOnSale: number;
  url: string;
}

/** A public car as the repositories serialize it; loose, as the serializer is. */
export interface PublicCarRow extends Partial<CarDisclosures> {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceCurrency?: string | null;
  mileage: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  color: string;
  status: string;
  seats?: number | null;
  images?: string[] | null;
  title?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  features?: string[] | null;
  featuresAr?: string[] | null;
  createdAt?: string | Date | null;
  organization?: {
    name: string;
    slug: string;
    city?: string | null;
    region?: string | null;
    phone?: string | null;
    address?: string | null;
    terms?: Partial<DealershipTerms>;
  } | null;
}

/** Long enough for any real description; bounds what one answer carries. */
const MAX_DESCRIPTION_CHARS = 1500;
const MAX_PHOTOS = 10;
const CAR_CURRENCY = "EGP";

function titleOf(car: PublicCarRow, locale: Locale): string {
  return resolveCarTitle(car, locale)?.text ?? `${car.year} ${car.make} ${car.model}`;
}

/** Public cars are AVAILABLE or SOLD (visibility.ts); anything else is a caller bug. */
function publicStatus(status: string): PublicCarSummary["status"] {
  if (status === "AVAILABLE" || status === "SOLD") return status;
  throw new Error(`A car with status ${status} reached a public projection`);
}

export function publicCarSummary(car: PublicCarRow, locale: Locale, from?: LinkSource): PublicCarSummary {
  const organization = car.organization;
  if (!organization) throw new Error("A public car needs its dealership loaded");
  return {
    id: car.id,
    title: titleOf(car, locale),
    make: car.make,
    model: car.model,
    year: car.year,
    price: { amount: car.price, currency: car.priceCurrency || CAR_CURRENCY },
    mileageKm: car.mileage,
    bodyType: car.bodyType,
    fuelType: car.fuelType,
    transmission: car.transmission,
    color: car.color,
    status: publicStatus(car.status),
    place: dealershipPlaceName(organization, locale) || null,
    dealership: { name: organization.name, slug: organization.slug },
    url: carUrl(car.id, locale, from),
    thumbnail: car.images?.[0] ?? null,
  };
}

export function publicCarDetail(car: PublicCarRow, locale: Locale, from?: LinkSource): PublicCarDetail {
  const summary = publicCarSummary(car, locale, from);
  const organization = car.organization!;
  const description = resolveCarDescription(car, locale);
  const listedOn = car.createdAt ? new Date(car.createdAt).toISOString().slice(0, 10) : null;
  return {
    ...summary,
    seats: car.seats ?? null,
    features: resolveCarFeatures(car, locale).features,
    description: description
      ? { text: description.text.slice(0, MAX_DESCRIPTION_CHARS), locale: description.locale }
      : null,
    history: statedDisclosures(car),
    photos: (car.images ?? []).slice(0, MAX_PHOTOS),
    listedOn,
    dealership: {
      ...summary.dealership,
      url: dealershipUrl(organization.slug, locale, from),
      phone: organization.phone ?? null,
      address: organization.address ?? null,
      // Stated already (the serializer); this puts the note in the reader's language.
      terms: statedTerms(organization.terms ?? {}, locale),
    },
  };
}

/** A public dealership as the listing repository returns it; loose, as that is JS. */
export interface PublicDealershipRow {
  name: string;
  slug: string;
  logo?: string | null;
  city?: string | null;
  region?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  carCount?: number | null;
}

export function publicDealership(row: PublicDealershipRow, locale: Locale, from?: LinkSource): PublicDealership {
  const reviews = row.totalReviews ?? 0;
  return {
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? null,
    place: dealershipPlaceName(row, locale) || null,
    rating: reviews > 0 ? { average: Math.round((row.averageRating ?? 0) * 10) / 10, outOf: 5, reviews } : null,
    carsOnSale: row.carCount ?? 0,
    url: dealershipUrl(row.slug, locale, from),
  };
}
