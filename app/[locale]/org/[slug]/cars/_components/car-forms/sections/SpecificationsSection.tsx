"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAR_COLORS } from "@/lib/constants/car-options";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import FormSection from "../shared/FormSection";
import FieldInfo from "../shared/FieldInfo";
import type { CarFormSectionProps } from "../shared/section-props";

type SpecificationsSectionProps = CarFormSectionProps & {
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
};

const SpecificationsSection = ({
  register,
  errors,
  watch,
  setValue,
  trigger,
  bodyTypes,
  fuelTypes,
  transmissions,
}: SpecificationsSectionProps) => {
  const t = useTranslations("org.carForm");
  const tField = useTranslations("carAttributes.fields");
  const tBody = useTranslations("carAttributes.body");
  const tFuel = useTranslations("carAttributes.fuel");
  const tTransmission = useTranslations("carAttributes.transmission");
  const { number } = useFormatters();
  const attr = useCarAttributes();

  // A fixed list, not free text: colour is stored in English because filters
  // and swatches match on it, and a listed colour always has a name in the
  // reader's language. An older car's unlisted colour is kept as an option so
  // editing it does not silently change it.
  const color = watch("color");
  const colorOptions =
    color && !CAR_COLORS.some((c) => c.toLowerCase() === color.toLowerCase())
      ? [...CAR_COLORS, color]
      : CAR_COLORS;

  // The Zod schema's output type for `features` is string[], but the textarea
  // is registered directly, so react-hook-form holds the raw comma-separated
  // string until the transform runs at validation time. Both shapes are real
  // at runtime, hence the widening.
  //
  // One list on screen, the dashboard language's; the other is translated on
  // save. The Arabic list also splits on the Arabic comma, as the schema does.
  const isArabic = useLocale() === "ar";
  const featuresField = isArabic ? "featuresAr" : "features";
  const featuresValue = watch(featuresField) as unknown as
    | string
    | string[]
    | undefined;
  const featureList = Array.isArray(featuresValue)
    ? featuresValue
    : (featuresValue?.split(isArabic ? /[,،]/ : ",") ?? []);


  return (
    <FormSection title={t("sections.specs")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 col-span-1 sm:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="bodyType" className="flex items-center">
              {tField("bodyType")}{" "}
              <FieldInfo text={t("fields.bodyTypeHint")} />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("bodyType", value, { shouldValidate: true });
                trigger("bodyType");
              }}
              defaultValue={watch("bodyType")}
            >
              <SelectTrigger
                id="bodyType"
                className={errors.bodyType ? "border-red-500" : ""}
              >
                <SelectValue placeholder={t("fields.bodyTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {tBody(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bodyType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.bodyType.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType" className="flex items-center">
              {tField("fuelType")} <FieldInfo text={t("fields.fuelTypeHint")} />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("fuelType", value, { shouldValidate: true });
                trigger("fuelType");
              }}
              defaultValue={watch("fuelType")}
            >
              <SelectTrigger
                id="fuelType"
                className={errors.fuelType ? "border-red-500" : ""}
              >
                <SelectValue placeholder={t("fields.fuelTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {tFuel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fuelType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.fuelType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission" className="flex items-center">
              {tField("transmission")}{" "}
              <FieldInfo text={t("fields.transmissionHint")} />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("transmission", value, { shouldValidate: true });
                trigger("transmission");
              }}
              defaultValue={watch("transmission")}
            >
              <SelectTrigger
                id="transmission"
                className={errors.transmission ? "border-red-500" : ""}
              >
                <SelectValue placeholder={t("fields.transmissionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {transmissions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {tTransmission(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transmission && (
              <p className="text-red-500 text-sm mt-1">
                {errors.transmission.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats" className="flex items-center">
              {tField("seats")} <FieldInfo text={t("fields.seatsHint")} />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("seats", parseInt(value), { shouldValidate: true });
                trigger("seats");
              }}
              defaultValue={watch("seats")?.toString()}
            >
              <SelectTrigger
                id="seats"
                className={errors.seats ? "border-red-500" : ""}
              >
                <SelectValue placeholder={t("fields.seatsPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {t("fields.seatsCount", { count: num, value: number(num) })}
                  </SelectItem>
                ))}
                <SelectItem value="6">
                  {t("fields.seatsMore", { count: number(5) })}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.seats && (
              <p className="text-red-500 text-sm mt-1">
                {errors.seats.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color" className="flex items-center">
          {tField("color")} <FieldInfo text={t("fields.colorHint")} />
        </Label>
        <Select
          value={colorOptions.find((c) => c.toLowerCase() === color?.toLowerCase()) ?? ""}
          onValueChange={(value) => {
            setValue("color", value, { shouldValidate: true, shouldDirty: true });
          }}
        >
          <SelectTrigger id="color" className={errors.color ? "border-red-500" : ""}>
            <SelectValue placeholder={t("fields.colorPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {attr.color(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.color && (
          <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={featuresField} className="flex items-center">
          {t("fields.featuresLabel")}{" "}
          <FieldInfo text={t("fields.featuresHint")} />
        </Label>
        <Textarea
          key={featuresField}
          id={featuresField}
          dir={isArabic ? "rtl" : "ltr"}
          lang={isArabic ? "ar" : "en"}
          placeholder={t("fields.featuresPlaceholder")}
          className={`min-h-[80px] ${errors[featuresField] ? "border-red-500" : ""}`}
          {...register(featuresField)}
        />
        {errors[featuresField] && (
          <p className="text-red-500 text-sm mt-1">{errors[featuresField]?.message}</p>
        )}
        {featureList.length > 0 && (
          <div dir={isArabic ? "rtl" : "ltr"} className="flex flex-wrap gap-1 mt-2">
            {featureList.map((feature, idx) =>
              feature.trim() ? (
                <Badge key={idx} variant="secondary" className="bg-blue-50">
                  {feature.trim()}
                </Badge>
              ) : null
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default SpecificationsSection;
