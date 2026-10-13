import type { Locale } from "@/i18n/routing";
import { dealershipPlaceName } from "@/lib/locations/names";
import { resolveCarDescription, resolveCarFeatures, resolveCarTitle } from "@/lib/utils/car-text";
import type { CarDetail } from "./car-detail-types";

/**
 * What get_car_details tells a browser agent about the car on the page:
 * what the page itself shows a visitor, condensed to Chrome's output budget
 * (about 1.5K characters). Built on the server from the car the page already
 * loaded, so the tool adds no request and no field the page does not show.
 */

const DESCRIPTION_CHARS = 500;
const FEATURES = 15;

export interface CarToolSummary {
  id: string;
  title: string;
  year: number;
  priceEgp: number;
  km: number;
  status: string;
  bodyType: string | null;
  fuelType: string | null;
  transmission: string | null;
  color: string | null;
  features: string[];
  /** Dealer-written; cut to fit. */
  description: string | null;
  /** Its place as the page names it, e.g. "Nasr City, Cairo". */
  dealership: { name: string; slug: string | null; place: string | null; phone: string | null } | null;
}

export function carToolSummary(car: CarDetail, locale: Locale): CarToolSummary {
  const description = resolveCarDescription(car, locale)?.text ?? null;
  const organization = car.organization;
  return {
    id: car.id,
    title: resolveCarTitle(car, locale)?.text ?? `${car.year} ${car.make} ${car.model}`,
    year: car.year,
    priceEgp: car.price,
    km: car.mileage,
    status: car.status,
    bodyType: car.bodyType ?? null,
    fuelType: car.fuelType ?? null,
    transmission: car.transmission ?? null,
    color: car.color ?? null,
    features: resolveCarFeatures(car, locale).features.slice(0, FEATURES),
    description:
      description && description.length > DESCRIPTION_CHARS ? `${description.slice(0, DESCRIPTION_CHARS)}…` : description,
    dealership: organization
      ? {
          name: organization.name,
          slug: organization.slug ?? null,
          place: dealershipPlaceName(organization, locale) || null,
          phone: organization.phone ?? null,
        }
      : null,
  };
}
