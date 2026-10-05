"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCarForEdit } from "@/actions/cars";
import { disclosuresToForm } from "@/lib/utils/car-disclosures";
import CarFormShared from "../../_components/car-forms/shared/CarFormShared";
import { STATUS_DB_TO_FORM } from "@/lib/constants/car-options";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";

export default function EditCarPage() {
  const t = useTranslations("org.carForm.edit");
  const tPage = useTranslations("org.carForm.modePage");
  const actionError = useActionError();
  const params = useParams();
  const carId = Array.isArray(params.carId) ? params.carId[0] : params.carId;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  // The car list, not the browser's previous page, which may be anywhere.
  const carsHref = `/org/${slug}/cars`;

  // The response is kept whole rather than thrown on failure: a thrown Error
  // carries only the English message, and the envelope carries the key.
  const { data: response, isLoading, error } = useQuery({
    queryKey: queryKeys.cars.detail(carId ?? ""),
    // `enabled` below keeps this from running without an id.
    queryFn: () => getCarForEdit(carId!),
    enabled: !!carId,
  });
  const car = response?.success ? response.data : null;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100">
            <Link href={carsHref} aria-label={t("backToCars")}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">{t("errorTitle")}</h2>
        <p className="text-gray-600 mb-4">
          {response && !response.success && !error
            ? actionError(response.error, t("errorBody"))
            : t("errorBody")}
        </p>
        <Button asChild>
          <Link href={carsHref}>{tPage("goBack")}</Link>
        </Button>
      </div>
    );
  }

  // Pre-process car data for the form
  const initialData = {
    ...car,
    status: STATUS_DB_TO_FORM[car.status] || "Available",
    // Ensure all numeric fields are actual numbers or empty strings
    year: car.year ? Number(car.year) : "",
    price: car.price ? Number(car.price) : "",
    mileage: car.mileage ? Number(car.mileage) : "",
    seats: car.seats ? Number(car.seats) : "",
    // The form holds these as select strings; the pre-fill effect writes what
    // it is given, so it must be given that shape, not the stored booleans.
    ...disclosuresToForm(car),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild className="hover:bg-slate-100">
          <Link href={carsHref} aria-label={t("backToCars")}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <CarFormShared
        initialData={initialData}
        isEditMode={true}
        carId={carId}
      />
    </div>
  );
}
