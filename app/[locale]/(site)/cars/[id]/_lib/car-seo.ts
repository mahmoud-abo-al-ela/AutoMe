import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { getCarById } from "@/actions/cars-listing";
import type { Locale } from "@/i18n/routing";
import { cityName } from "@/lib/locations/names";
import { resolveCarDescription, resolveCarTitle } from "@/lib/utils/car-text";
import { fitsTitle, truncateForMeta } from "@/lib/utils/seo-meta";
import type { CarDetail } from "./car-detail-types";

export const loadCar = cache((id: string) => getCarById(id));

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
