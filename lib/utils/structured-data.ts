import type { Locale } from "@/i18n/routing";
import type { DayOfWeek } from "@/lib/generated/prisma";
import { localizedUrl, mainOrigin } from "./seo-meta";

/**
 * JSON-LD documents for search engines, one builder per page type. Pure (no
 * JSX — `StructuredData` in `seo.tsx` renders them) so metadata code and the
 * node tests load them directly.
 *
 * Every URL is absolute and carries the page's locale: a relative or
 * locale-less URL is a redirect, or another language's page, to a crawler.
 * Fields the listing does not state are left out, never sent as null, 0 or
 * "" — structured data that claims a price of 0 is worse than none.
 */

type Doc = Record<string, unknown>;

const SCHEMA = "https://schema.org";

/** Drop what is not stated: null, undefined, "" and empty arrays. */
function stated(doc: Doc): Doc {
  return Object.fromEntries(
    Object.entries(doc).filter(
      ([, value]) => value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)
    )
  );
}

export function breadcrumbStructuredData(items: { name: string; path: string }[], locale: Locale): Doc | null {
  if (items.length === 0) return null;
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localizedUrl(item.path, locale),
    })),
  };
}

/** The car fields the builder reads — what the public detail query returns. */
export interface StructuredDataCar {
  id: string;
  make: string;
  model: string;
  year: number;
  /** Whole EGP, as serialized. */
  price: number;
  priceCurrency?: string | null;
  mileage: number;
  fuelType?: string | null;
  transmission?: string | null;
  color?: string | null;
  bodyType?: string | null;
  seats?: number | null;
  status: string;
  images?: (string | { url: string })[] | null;
  organization?: { name: string; slug: string } | null;
}

const AVAILABILITY: Record<string, string> = {
  AVAILABLE: `${SCHEMA}/InStock`,
  SOLD: `${SCHEMA}/SoldOut`,
  UNAVAILABLE: `${SCHEMA}/OutOfStock`,
};

/**
 * A listing as schema.org `Car` with its `Offer`: what makes a car page
 * eligible for price and availability in results. `name` and `description`
 * are the page's own resolved title and meta description, so the markup says
 * what the page says.
 */
export function carStructuredData(
  car: StructuredDataCar,
  locale: Locale,
  text: { name: string; description?: string | null }
): Doc {
  const url = localizedUrl(`/cars/${car.id}`, locale);
  const images = (car.images ?? []).map((image) => (typeof image === "string" ? image : image.url)).filter(Boolean);
  const hasPrice = Number.isFinite(car.price) && car.price > 0;

  return stated({
    "@context": SCHEMA,
    "@type": "Car",
    "@id": url,
    url,
    name: text.name,
    description: text.description,
    brand: { "@type": "Brand", name: car.make },
    model: car.model,
    vehicleModelDate: String(car.year),
    bodyType: car.bodyType,
    fuelType: car.fuelType,
    vehicleTransmission: car.transmission,
    color: car.color,
    seatingCapacity: car.seats ?? null,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileage, unitCode: "KMT" },
    // Driven means used. Zero kilometres is left unstated rather than
    // claimed new: the listing has no condition field to say so.
    itemCondition: car.mileage > 0 ? `${SCHEMA}/UsedCondition` : null,
    image: images,
    offers: stated({
      "@type": "Offer",
      url,
      // Whole pounds as a string: schema.org reads it as text, and a
      // serialized float never gets the chance to print "1.2e+6".
      price: hasPrice ? Math.round(car.price).toString() : null,
      priceCurrency: hasPrice ? car.priceCurrency || "EGP" : null,
      availability: AVAILABILITY[car.status] ?? null,
      seller: car.organization
        ? {
            "@type": "AutoDealer",
            name: car.organization.name,
            url: localizedUrl(`/dealerships/${car.organization.slug}`, locale),
          }
        : null,
    }),
  });
}

const SCHEMA_DAY: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

/** A dealership's text already in the page's language (see the page). */
export interface StructuredDataDealership {
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  /** Street address in the page's language. */
  address?: string | null;
  city?: string | null;
  region?: string | null;
  phone?: string | null;
  /** The dealer's own site: a profile of the same business, not this page. */
  website?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  workingHours?: { dayKey: DayOfWeek; openTime: string; closeTime: string; isOpen: boolean }[] | null;
}

export function dealershipStructuredData(dealership: StructuredDataDealership, locale: Locale): Doc {
  const url = localizedUrl(`/dealerships/${dealership.slug}`, locale);
  const rated = (dealership.totalReviews ?? 0) > 0 && (dealership.averageRating ?? 0) > 0;
  const hours = (dealership.workingHours ?? []).filter((row) => row.isOpen);

  return stated({
    "@context": SCHEMA,
    "@type": "AutoDealer",
    "@id": url,
    url,
    name: dealership.name,
    description: dealership.description,
    image: dealership.logo,
    logo: dealership.logo,
    telephone: dealership.phone,
    sameAs: dealership.website ? [dealership.website] : null,
    address:
      dealership.address || dealership.city || dealership.region
        ? stated({
            "@type": "PostalAddress",
            streetAddress: dealership.address,
            addressLocality: dealership.city,
            addressRegion: dealership.region,
            addressCountry: "EG",
          })
        : null,
    aggregateRating: rated
      ? {
          "@type": "AggregateRating",
          ratingValue: (Math.round(dealership.averageRating! * 10) / 10).toString(),
          reviewCount: dealership.totalReviews,
          bestRating: "5",
          worstRating: "1",
        }
      : null,
    openingHoursSpecification: hours.map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY[row.dayKey],
      opens: row.openTime,
      closes: row.closeTime,
    })),
  });
}

/**
 * The marketplace itself, for the home page: who publishes the site, and the
 * search box (the cars list's `search` parameter, hooks/cars-page-filters.ts).
 */
export function siteStructuredData(locale: Locale, text: { name: string; description: string }): Doc[] {
  const origin = mainOrigin();
  const home = localizedUrl("/", locale);
  return [
    {
      "@context": SCHEMA,
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: text.name,
      url: home,
      logo: `${origin}/brand/autome-logo.png`,
    },
    {
      "@context": SCHEMA,
      "@type": "WebSite",
      "@id": `${origin}/#website-${locale}`,
      name: text.name,
      description: text.description,
      url: home,
      inLanguage: locale === "ar" ? "ar-EG" : "en-EG",
      publisher: { "@id": `${origin}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${localizedUrl("/cars", locale)}?search={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/** Questions and answers exactly as the page shows them, as plain text. */
export function faqStructuredData(items: { question: string; answer: string }[]): Doc | null {
  if (items.length === 0) return null;
  return {
    "@context": SCHEMA,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
