"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormSection from "../shared/FormSection";
import FieldInfo from "../shared/FieldInfo";
import { STATUS_FORM_TO_DB } from "@/lib/constants/car-options";
import type { CarFormSectionProps } from "../shared/section-props";
import type { CarFormValues } from "@/hooks/use-car-form";

/** The three form-level status tokens, in the order they are offered. */
const STATUS_OPTIONS = ["Available", "Sold", "Unavailable"] as const;

const StatusSection = ({
  errors,
  watch,
  setValue,
  trigger,
}: Pick<
  CarFormSectionProps,
  "errors" | "watch" | "setValue" | "trigger"
>) => {
  const t = useTranslations("org.carForm");
  const tField = useTranslations("carAttributes.fields");
  const tStatus = useTranslations("carAttributes.status");

  const watchStatus = watch("status") || "Available";

  // The stored value stays the English form token — it is what the schema
  // validates and what STATUS_FORM_TO_DB maps to the Prisma enum. Only the
  // label the dealer reads is translated.
  const statusLabel = (value: string) =>
    tStatus(STATUS_FORM_TO_DB[value as keyof typeof STATUS_FORM_TO_DB]);

  return (
    <FormSection title={t("sections.status")}>
      <div className="space-y-2">
        <Label htmlFor="status" className="flex items-center">
          {tField("status")} <FieldInfo text={t("fields.statusHint")} />
        </Label>
        <Select
          onValueChange={(value) => {
            // Radix hands back a plain string; the three items below are the
            // schema's three statuses.
            setValue("status", value as CarFormValues["status"]);
            if (errors.status) {
              trigger("status");
            }
          }}
          value={watchStatus}
          defaultValue={watchStatus}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder={t("fields.statusPlaceholder")}>
              {statusLabel(watchStatus)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
        )}
      </div>

      <div className="flex items-start sm:items-center gap-2 p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-100">
        <Checkbox
          id="featured"
          checked={watch("featured")}
          onCheckedChange={(checked) => {
            // `checked` can be "indeterminate", which `|| false` let through as
            // a truthy string.
            setValue("featured", checked === true);
          }}
          className="mt-1 sm:mt-0"
        />
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="featured" className="font-medium">
            {t("fields.featuredLabel")}
          </Label>
          <p className="text-xs sm:text-sm text-gray-500">
            {t("fields.featuredHint")}
          </p>
          <p className="text-xs text-blue-600">
            {t("fields.featuredCurrent", {
              value: watch("featured") ? t("fields.yes") : t("fields.no"),
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-md border border-green-100">
        <h4 className="text-green-700 font-medium flex items-center gap-1.5">
          <Check className="h-4 w-4" />
          {t("fields.readyTitle")}
        </h4>
        <p className="text-xs sm:text-sm text-green-600 mt-1">
          {t("fields.readyBody")}
        </p>
      </div>
    </FormSection>
  );
};

export default StatusSection;
