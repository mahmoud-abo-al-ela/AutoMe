"use client";

import { useLocale, useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarFormValues } from "@/hooks/use-car-form";
import { BODY_TYPES, CAR_COLORS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";
import { cn } from "@/lib/utils";
import { Field, FieldSelect, inputClass } from "./editor-ui";
import { FeaturesInput } from "./FeaturesInput";

const SEATS = [1, 2, 3, 4, 5, 6];

/**
 * Step 2: what the car is. Make, model and year also write the title buyers
 * see, shown under them as it forms. Fields the AI read from the photos carry
 * its mark until the dealer changes them.
 */
export function CarStep({ form, isAi }: { form: UseFormReturn<CarFormValues>; isAi: (field: keyof CarFormValues) => boolean }) {
  const t = useTranslations("org.carForm");
  const tField = useTranslations("carAttributes.fields");
  const attr = useCarAttributes();
  const fmt = useFormatters();
  const isArabic = useLocale() === "ar";
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const set = (field: "bodyType" | "fuelType" | "transmission" | "color", value: string) =>
    setValue(field, value, { shouldValidate: true, shouldDirty: true });

  // An older car's colour outside the list stays selectable, so editing it changes nothing.
  const color = watch("color");
  const colors = color && !CAR_COLORS.some((c) => c.toLowerCase() === color.toLowerCase()) ? [...CAR_COLORS, color] : CAR_COLORS;

  // One features list on screen, the dashboard language's; the other is translated on save.
  // An older car may still hold the raw comma-separated text.
  const featuresField = isArabic ? "featuresAr" : "features";
  const featuresValue = watch(featuresField) as unknown as string | string[] | undefined;
  const features = (Array.isArray(featuresValue) ? featuresValue : (featuresValue ?? "").split(isArabic ? /[,،]/ : ","))
    .map((feature) => feature.trim())
    .filter(Boolean);

  const title = watch("title");
  const err = (field: keyof CarFormValues) => errors[field]?.message as string | undefined;
  const describedBy = (field: string) => (errors[field as keyof CarFormValues] ? `${field}-error` : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field id="make" label={tField("make")} ai={isAi("make")} error={err("make")}>
          <input id="make" autoComplete="off" aria-describedby={describedBy("make")} className={inputClass({ error: !!errors.make, ai: isAi("make") })} {...register("make")} />
        </Field>
        <Field id="model" label={tField("model")} ai={isAi("model")} error={err("model")}>
          <input id="model" autoComplete="off" aria-describedby={describedBy("model")} className={inputClass({ error: !!errors.model, ai: isAi("model") })} {...register("model")} />
        </Field>
        <Field id="year" label={tField("year")} ai={isAi("year")} error={err("year")}>
          <input
            id="year"
            type="number"
            inputMode="numeric"
            aria-describedby={describedBy("year")}
            className={inputClass({ error: !!errors.year, ai: isAi("year") })}
            {...register("year", { valueAsNumber: true })}
          />
        </Field>

        <p className="col-span-full -mt-1 text-caption text-muted-foreground">
          {t("fields.titleLabel")}:{" "}
          {title ? (
            <bdi className="font-semibold text-foreground">{title}</bdi>
          ) : (
            <span>{t("fields.titlePending")}</span>
          )}
        </p>

        <Field id="mileage" label={tField("mileage")} ai={isAi("mileage")} error={err("mileage")}>
          <span className="relative">
            <input
              id="mileage"
              type="number"
              inputMode="numeric"
              aria-describedby={describedBy("mileage")}
              className={cn(inputClass({ error: !!errors.mileage, ai: isAi("mileage") }), "pe-12")}
              {...register("mileage", { setValueAs: (value) => (value === "" ? 0 : Number(value)) })}
            />
            <span aria-hidden className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-caption text-muted-foreground">
              {isArabic ? "كم" : "km"}
            </span>
          </span>
        </Field>
        <Field id="bodyType" label={tField("bodyType")} ai={isAi("bodyType")} error={err("bodyType")}>
          <FieldSelect
            id="bodyType"
            value={watch("bodyType")}
            onChange={(value) => set("bodyType", value)}
            options={BODY_TYPES.map((type) => ({ value: type, label: attr.body(type) }))}
            placeholder={t("fields.bodyTypePlaceholder")}
            error={!!errors.bodyType}
            ai={isAi("bodyType")}
          />
        </Field>
        <Field id="fuelType" label={tField("fuelType")} ai={isAi("fuelType")} error={err("fuelType")}>
          <FieldSelect
            id="fuelType"
            value={watch("fuelType")}
            onChange={(value) => set("fuelType", value)}
            options={FUEL_TYPES.map((type) => ({ value: type, label: attr.fuel(type) }))}
            placeholder={t("fields.fuelTypePlaceholder")}
            error={!!errors.fuelType}
            ai={isAi("fuelType")}
          />
        </Field>
        <Field id="transmission" label={tField("transmission")} ai={isAi("transmission")} error={err("transmission")}>
          <FieldSelect
            id="transmission"
            value={watch("transmission")}
            onChange={(value) => set("transmission", value)}
            options={TRANSMISSIONS.map((type) => ({ value: type, label: attr.transmission(type) }))}
            placeholder={t("fields.transmissionPlaceholder")}
            error={!!errors.transmission}
            ai={isAi("transmission")}
          />
        </Field>
        <Field id="seats" label={tField("seats")} ai={isAi("seats")} error={err("seats")}>
          <FieldSelect
            id="seats"
            value={watch("seats") ? String(watch("seats")) : ""}
            onChange={(value) => setValue("seats", Number(value), { shouldValidate: true, shouldDirty: true })}
            options={SEATS.map((count) => ({
              value: String(count),
              label:
                count === SEATS.at(-1)
                  ? t("fields.seatsMore", { count: fmt.number(count - 1) })
                  : t("fields.seatsCount", { count, value: fmt.number(count) }),
            }))}
            placeholder={t("fields.seatsPlaceholder")}
            error={!!errors.seats}
            ai={isAi("seats")}
          />
        </Field>
        <Field id="color" label={tField("color")} ai={isAi("color")} error={err("color")}>
          <FieldSelect
            id="color"
            value={colors.find((c) => c.toLowerCase() === color?.toLowerCase()) ?? ""}
            onChange={(value) => set("color", value)}
            options={colors.map((option) => ({ value: option, label: attr.color(option) }))}
            placeholder={t("fields.colorPlaceholder")}
            error={!!errors.color}
            ai={isAi("color")}
          />
        </Field>
      </div>

      <FeaturesInput
        id={featuresField}
        label={t("fields.featuresLabel")}
        value={features}
        onChange={(next) => setValue(featuresField, next, { shouldDirty: true })}
        ai={isAi(featuresField)}
        dir={isArabic ? "rtl" : "ltr"}
        lang={isArabic ? "ar" : "en"}
      />
    </div>
  );
}
