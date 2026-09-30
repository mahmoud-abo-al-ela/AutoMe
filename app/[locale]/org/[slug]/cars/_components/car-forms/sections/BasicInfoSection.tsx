"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import FormSection from "../shared/FormSection";
import FieldInfo from "../shared/FieldInfo";
import type { CarFormSectionProps } from "../shared/section-props";

const BasicInfoSection = ({
  register,
  errors,
  watch,
}: Pick<CarFormSectionProps, "register" | "errors" | "watch">) => {
  const t = useTranslations("org.carForm");
  // The field names themselves are shared with the public car pages, so they
  // come from carAttributes rather than a second copy here.
  const tField = useTranslations("carAttributes.fields");

  return (
    <FormSection title={t("sections.basic")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make" className="flex items-center text-sm">
            {tField("make")} <FieldInfo text={t("fields.makeHint")} />
          </Label>
          <Input
            type="text"
            id="make"
            placeholder="Tesla"
            {...register("make")}
            className={`${errors.make ? "border-red-500" : ""} text-sm`}
          />
          {errors.make && (
            <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className="flex items-center">
            {tField("model")} <FieldInfo text={t("fields.modelHint")} />
          </Label>
          <Input
            type="text"
            id="model"
            placeholder="Model 3"
            {...register("model")}
            className={`${errors.model ? "border-red-500" : ""}`}
          />
          {errors.model && (
            <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year" className="flex items-center">
            {tField("year")} <FieldInfo text={t("fields.yearHint")} />
          </Label>
          <Input
            type="number"
            id="year"
            placeholder="2023"
            {...register("year", { valueAsNumber: true })}
            className={`${errors.year ? "border-red-500" : ""}`}
          />
          {errors.year && (
            <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center">
            {t("fields.titleLabel")} <FieldInfo text={t("fields.titleHint")} />
          </Label>
          <Input
            type="text"
            id="title"
            placeholder={t("fields.titlePlaceholder")}
            value={watch("title") || ""}
            className="bg-gray-100"
            disabled
            readOnly
          />
          {/* The visible field is disabled, so the value reaches the form
              through this one. Its required message is the schema's. */}
          <input type="hidden" {...register("title")} />
          {watch("make") && watch("model") && watch("year") ? (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <Check className="h-3 w-3" /> {t("fields.titleReady")}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              {t("fields.titlePending")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center">
            {t("fields.priceLabel")} <FieldInfo text={t("fields.priceHint")} />
          </Label>
          <Input
            type="number"
            id="price"
            placeholder="48990"
            {...register("price", { valueAsNumber: true })}
            className={`${errors.price ? "border-red-500" : ""}`}
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">
            {tField("mileage")} <FieldInfo text={t("fields.mileageHint")} />
          </Label>
          <Input
            type="number"
            id="mileage"
            placeholder="1200"
            {...register("mileage", { valueAsNumber: true })}
            className={`${errors.mileage ? "border-red-500" : ""}`}
          />
          {errors.mileage && (
            <p className="text-red-500 text-sm mt-1">
              {errors.mileage.message}
            </p>
          )}
        </div>
      </div>
    </FormSection>
  );
};

export default BasicInfoSection;
