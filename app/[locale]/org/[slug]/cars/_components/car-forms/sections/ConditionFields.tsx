"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/common/MonthPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormatters } from "@/hooks/use-formatters";
import { SERVICE_HISTORY, UNSET } from "@/lib/utils/car-disclosures";
import type { CarFormSectionProps } from "../shared/section-props";

type Props = Pick<CarFormSectionProps, "watch" | "setValue">;

const TRI_STATE_FIELDS = ["originalPaint", "accidentFree", "priceNegotiable"] as const;
const OWNER_OPTIONS = [1, 2, 3, 4, 5, 6];

/**
 * What buyers ask before anything else. All optional, and "Not stated" is a
 * real answer: it is shown as nothing on the listing, and the buyer assistant
 * declines rather than guessing either way.
 */
export default function ConditionFields({ watch, setValue }: Props) {
  const t = useTranslations("org.carForm.condition");
  const { number } = useFormatters();
  const set = (field: Parameters<Props["setValue"]>[0], value: string) =>
    setValue(field, value as never, { shouldDirty: true });

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRI_STATE_FIELDS.map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>{t(`fields.${field}`)}</Label>
            <Select value={watch(field) ?? UNSET} onValueChange={(value) => set(field, value)}>
              <SelectTrigger id={field}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>{t("notStated")}</SelectItem>
                <SelectItem value="yes">{t("yes")}</SelectItem>
                <SelectItem value="no">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="ownerCount">{t("fields.ownerCount")}</Label>
          <Select
            value={watch("ownerCount") ?? UNSET}
            onValueChange={(value) => set("ownerCount", value)}
          >
            <SelectTrigger id="ownerCount">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>{t("notStated")}</SelectItem>
              {OWNER_OPTIONS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count === OWNER_OPTIONS.at(-1)
                    ? t("ownersOrMore", { value: number(count) })
                    : t("owners", { count, value: number(count) })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceHistory">{t("fields.serviceHistory")}</Label>
          <Select
            value={watch("serviceHistory") ?? UNSET}
            onValueChange={(value) => set("serviceHistory", value)}
          >
            <SelectTrigger id="serviceHistory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>{t("notStated")}</SelectItem>
              {SERVICE_HISTORY.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`service.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseValidUntil">{t("fields.licenseValidUntil")}</Label>
          <MonthPicker
            id="licenseValidUntil"
            value={watch("licenseValidUntil") ?? ""}
            onChange={(value) => set("licenseValidUntil", value)}
            placeholder={t("notStated")}
            clearLabel={t("monthPicker.clear")}
            previousYearLabel={t("monthPicker.previousYear")}
            nextYearLabel={t("monthPicker.nextYear")}
          />
        </div>
      </div>
    </div>
  );
}
