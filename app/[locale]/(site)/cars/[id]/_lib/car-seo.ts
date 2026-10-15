import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { getCarById } from "@/actions/cars-listing";
import type { Locale } from "@/i18n/routing";
import { cityName } from "@/lib/locations/names";
import { resolveCarDescription, resolveCarTitle } from "@/lib/utils/car-text";
import { fitsTitle, truncateForMeta } from "@/lib/utils/seo-meta";
import type { CarDetail } from "./car-detail-types";

/**
 * One car read per request, shared by generateMetadata and the page body —
 * each used to fetch the car on its own. Per-render data only: the action
 * still checks the storefront on every call that is not a repeat.
 */
export const loadCar = cache((id: string) => getCarById(id));

/**
 * The page's words about the car, shared by its metadata and its structured
 * data so the two never disagree.
 *
 * `headline` is the listing's own title in the reader's language (or the
 * other one, before "year make model"). `title` adds what a search matches
 * on — "for sale", and the city — as long as it still fits a results line
 * with the brand appended; it drops the place first, then the phrase.
 */
export async function carPageText(car: CarDetail, locale: Locale) {
  const t = await getTranslations({ locale, namespace: "carDetail.meta" });
  const headline = resolveCarTitle(car, locale)?.text ?? `${car.year} ${car.make} ${car.model}`;
  const place = cityName(car.organization?.city, locale);

  const title =
    [
      place ? t("titleForSale", { title: headline, place }) : null,
      t("titleForSaleNoPlace", { title: headline }),
    ].find((candidate): candidate is string => !!candidate && fitsTitle(candidate)) ?? headline;

  const resolved = resolveCarDescription(car, locale);
  const description = resolved
    ? truncateForMeta(resolved.text)
    : t("generatedDescription", { year: String(car.year), make: car.make, model: car.model });

  return { headline, title, description };
}
