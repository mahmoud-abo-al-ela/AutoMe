"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FairPriceGauge, usePriceVerdictText } from "@/components/brand/FairPriceGauge";
import { comparePrice } from "@/actions/cars";
import { useDebounce } from "@/hooks/use-debounce";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarFormValues } from "@/hooks/use-car-form";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { UNSET } from "@/lib/utils/car-disclosures";
import { cn } from "@/lib/utils";
import { ChoiceCards, Field, inputClass, StepSection } from "./editor-ui";
import ListingQualityPanel from "./ListingQualityPanel";

const VERDICT_TONE = {
  below: "text-price-below",
  above: "text-price-above",
  fair: "text-foreground",
  unknown: "text-muted-foreground",
} as const;

/**
 * Step 4: the price — placed among similar cars as it is typed, by the same
 * comparison the public listing's gauge uses — then the words buyers read,
 * who sees the car, and the listing check. When adding, the buttons below
 * choose between publishing and keeping it hidden; when editing, the status
 * is chosen here.
 */
export function PublishStep({
  form,
  isAi,
  isEditMode,
  carId,
}: {
  form: UseFormReturn<CarFormValues>;
  isAi: (field: keyof CarFormValues) => boolean;
  isEditMode: boolean;
  carId: string | null;
}) {
  const t = useTranslations("org.carForm");
  const tStatus = useTranslations("org.cars.ledger.status");
  const fmt = useFormatters();
  const isArabic = useLocale() === "ar";
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const descriptionField = isArabic ? "descriptionAr" : "description";
  const description = watch(descriptionField) ?? "";

  return (
    <div className="flex flex-col gap-8">
      <StepSection title={t("editor.price.title")}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start">
          <div className="flex flex-col gap-3">
            <Field id="price" label={t("editor.price.label")} ai={isAi("price")} error={errors.price?.message}>
              <span className="relative">
                <span aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-caption text-muted-foreground">
                  {isArabic ? "ج.م." : "EGP"}
                </span>
                <input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  aria-describedby={errors.price ? "price-error" : undefined}
                  className={cn(inputClass({ error: !!errors.price, ai: isAi("price") }), "ps-14 font-semibold tabular-nums")}
                  {...register("price", { valueAsNumber: true })}
                />
              </span>
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body">
              <Checkbox
                checked={watch("priceNegotiable") === "yes"}
                onCheckedChange={(checked) => setValue("priceNegotiable", checked === true ? "yes" : UNSET, { shouldDirty: true })}
                className="size-5 border-[#8c8170] bg-field"
              />
              {t("editor.price.negotiable")}
            </label>
          </div>
          <PriceComparison form={form} carId={carId} />
        </div>
      </StepSection>

      <StepSection title={t("editor.text.title")} lead={isArabic ? t("editor.text.leadAr") : t("editor.text.lead")}>
        {isArabic && (
          <Field id="titleAr" label={t("fields.titleArLabel")} ai={isAi("titleAr")} hint={t("fields.titleArHint")}>
            <input id="titleAr" dir="rtl" lang="ar" placeholder={t("fields.titleArPlaceholder")} className={inputClass({ ai: isAi("titleAr") })} {...register("titleAr")} />
          </Field>
        )}
        <Field
          id={descriptionField}
          label={t("fields.descriptionLabel")}
          ai={isAi(descriptionField)}
          error={errors[descriptionField]?.message}
          hint={
            <span className="flex justify-between gap-4">
              <span>{t("fields.descriptionMin", { count: fmt.number(VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH) })}</span>
              <span className="tabular-nums">{t("fields.descriptionCount", { count: fmt.number(description.length) })}</span>
            </span>
          }
        >
          <Textarea
            key={descriptionField}
            id={descriptionField}
            dir={isArabic ? "rtl" : "ltr"}
            lang={isArabic ? "ar" : "en"}
            placeholder={t("fields.descriptionPlaceholder")}
            aria-describedby={errors[descriptionField] ? `${descriptionField}-error` : undefined}
            className={cn(inputClass({ error: !!errors[descriptionField], ai: isAi(descriptionField) }), "h-auto min-h-36 py-2.5")}
            {...register(descriptionField)}
          />
        </Field>
      </StepSection>

      <StepSection title={t("editor.visibility.title")}>
        {isEditMode && (
          <div className="flex flex-col gap-2">
            <p className="text-caption font-semibold">{t("editor.visibility.status")}</p>
            <ChoiceCards
              name="status"
              label={t("editor.visibility.status")}
              value={watch("status")}
              onChange={(value) => setValue("status", value as CarFormValues["status"], { shouldDirty: true })}
              options={[
                { value: "Available", label: tStatus("AVAILABLE") },
                { value: "Unavailable", label: tStatus("UNAVAILABLE") },
                { value: "Sold", label: tStatus("SOLD") },
              ]}
            />
          </div>
        )}
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={!!watch("featured")}
            onCheckedChange={(checked) => setValue("featured", checked === true, { shouldDirty: true })}
            className="mt-0.5 size-5 border-[#8c8170] bg-field"
          />
          <span className="flex flex-col">
            <span className="text-body font-semibold">{t("fields.featuredLabel")}</span>
            <span className="text-caption text-muted-foreground">{t("fields.featuredHint")}</span>
          </span>
        </label>
      </StepSection>

      <ListingQualityPanel watch={watch} />
    </div>
  );
}

/**
 * Where the typed price sits among similar cars on AutoMe, re-asked half a
 * second after typing stops. Says plainly when there is nothing to compare.
 */
function PriceComparison({ form, carId }: { form: UseFormReturn<CarFormValues>; carId: string | null }) {
  const t = useTranslations("org.carForm.editor.price");
  const fmt = useFormatters();
  const [make, model, bodyType, year, price] = form.watch(["make", "model", "bodyType", "year", "price"]);
  // Debounced as a string: an object would be new on every render and never settle.
  const key = useDebounce(JSON.stringify({ carId: carId ?? undefined, make, model, bodyType, year: Number(year), price: Number(price) }), 500);
  const input = JSON.parse(key) as { carId?: string; make: string; model: string; bodyType: string; year: number; price: number };
  const ready = !!input.make && !!input.model && input.year > 0 && input.price > 0;

  const query = useQuery({
    queryKey: ["cars", "price-comparison", input],
    queryFn: async () => {
      const response = await comparePrice(input);
      if (!response.success) throw response.error;
      return response.data;
    },
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
  const position = query.data ?? null;
  const verdict = usePriceVerdictText(position?.percent ?? null);

  return (
    <div aria-live="polite" className="flex min-h-[7.5rem] flex-col justify-center gap-2 rounded-control border border-border bg-field px-4 py-3.5">
      {!ready ? (
        <p className="text-caption text-muted-foreground">{t("waiting")}</p>
      ) : query.isLoading ? (
        <p className="text-caption text-muted-foreground">{t("checking")}</p>
      ) : !position ? (
        <p className="text-caption text-muted-foreground">{t("unknown")}</p>
      ) : (
        <>
          <p className="text-caption font-semibold">{t("against", { count: fmt.number(position.listings) })}</p>
          <FairPriceGauge percent={position.percent} />
          <p className={cn("text-body font-semibold", VERDICT_TONE[verdict.verdict])}>{verdict.text}</p>
          <p className="text-caption text-muted-foreground">{t("median", { median: fmt.price(position.median) })}</p>
        </>
      )}
    </div>
  );
}
