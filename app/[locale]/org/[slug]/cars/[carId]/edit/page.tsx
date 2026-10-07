"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-client";
import { getCarForEdit } from "@/actions/cars";
import { disclosuresToForm } from "@/lib/utils/car-disclosures";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { STATUS_DB_TO_FORM } from "@/lib/constants/car-options";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { CarEditor } from "../../_components/editor/CarEditor";
import { StatusPill } from "../../_components/ledger/ledger-shared";

/**
 * Editing a car: the same four steps as adding, every one open from the
 * rail, with "Save changes" on each. The heading is the car itself — its name
 * as buyers read it, its status, and a link to the live listing.
 */
export default function EditCarPage() {
  const t = useTranslations("org.carForm.edit");
  const tEditor = useTranslations("org.carForm.editor");
  const actionError = useActionError();
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const params = useParams<{ carId: string; slug: string }>();
  const { carId, slug } = params;
  const carsHref = `/org/${slug}/cars`;

  // The response is kept whole rather than thrown on failure: a thrown Error
  // carries only the English message, and the envelope carries the key.
  const { data: response, isLoading, error } = useQuery({
    queryKey: queryKeys.cars.detail(carId),
    queryFn: () => getCarForEdit(carId),
    enabled: !!carId,
  });
  const car = response?.success ? response.data : null;

  // Built once per loaded car: the form copies it in whenever it changes identity.
  const initialData = useMemo(
    () =>
      car
        ? {
            ...car,
            status: STATUS_DB_TO_FORM[car.status] || "Available",
            year: car.year ? Number(car.year) : "",
            price: car.price ? Number(car.price) : "",
            mileage: Number(car.mileage ?? 0),
            seats: car.seats ? Number(car.seats) : "",
            // The form holds these as choice strings, not the stored booleans.
            ...disclosuresToForm(car),
          }
        : null,
    [car],
  );

  if (isLoading) {
    return (
      <div aria-busy className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col gap-3">
          <span className="skeleton-shimmer h-4 w-32 rounded" />
          <span className="skeleton-shimmer h-9 w-56 rounded" />
          <span className="skeleton-shimmer mt-4 hidden h-48 w-full rounded-control lg:block" />
        </div>
        <span className="skeleton-shimmer h-[32rem] w-full rounded-sheet" />
      </div>
    );
  }

  if (error || !car || !initialData) {
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <h1 className="text-h2 font-extrabold">{t("errorTitle")}</h1>
        <p className="text-body text-muted-foreground">
          {response && !response.success && !error ? actionError(response.error, t("errorBody")) : t("errorBody")}
        </p>
        <Link href={carsHref} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "mt-2 bg-field")}>
          {t("backToCars")}
        </Link>
      </div>
    );
  }

  const name =
    resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model} ${fmt.number(Number(car.year), { useGrouping: false })}`;

  return (
    <CarEditor
      mode="edit"
      carId={carId}
      initialData={initialData}
      title={
        <>
          <p className="text-caption text-muted-foreground">
            <Link href={carsHref} className="text-[#1d4e9e] hover:underline">
              {tEditor("cars")}
            </Link>{" "}
            / <bdi>{name}</bdi>
          </p>
          <h1 dir="auto" className="text-h2 font-extrabold leading-tight">
            {name}
          </h1>
        </>
      }
      aside={
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={car.status} />
          <a href={`/${locale}/cars/${car.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-caption font-semibold text-[#1d4e9e] hover:underline">
            {tEditor("viewOnSite")}
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>
      }
    />
  );
}
