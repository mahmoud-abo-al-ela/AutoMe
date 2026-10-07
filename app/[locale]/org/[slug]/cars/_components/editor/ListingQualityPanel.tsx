"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gauge, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewListingQuality } from "@/actions/cars";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import { GOOD_PHOTOS, MIN_PHOTOS } from "@/lib/services/car/listing-quality";
import type { UseFormWatch } from "react-hook-form";
import type { CarFormValues } from "@/hooks/use-car-form";

type Review = Extract<
  Awaited<ReturnType<typeof reviewListingQuality>>,
  { success: true }
>["data"];

const SEVERITY_STYLE = {
  high: "border-destructive/40 bg-destructive/5",
  medium: "border-[#a87200]/40 bg-marker-soft",
  low: "border-border bg-muted/50",
} as const;

/** The form holds features as a list or as the raw comma-separated text. */
function featureList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/[,،]/);
  return [];
}

/**
 * The listing-quality coach, on demand from the form's last step. Reviews the
 * listing as the form holds it right now — in the dashboard's language, the
 * one the dealer is writing in — not as last saved.
 */
export default function ListingQualityPanel({ watch }: { watch: UseFormWatch<CarFormValues> }) {
  const t = useTranslations("org.carForm.coach");
  const { number } = useFormatters();
  const actionError = useActionError();
  const isArabic = useLocale() === "ar";
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    setError(null);
    const result = await reviewListingQuality({
      year: Number(watch("year")) || 0,
      make: watch("make") ?? "",
      model: watch("model") ?? "",
      mileage: Number(watch("mileage")) || 0,
      bodyType: watch("bodyType") ?? "",
      description: (isArabic ? watch("descriptionAr") : watch("description")) ?? "",
      features: featureList(isArabic ? watch("featuresAr") : watch("features")),
      imageCount: (watch("images") ?? []).length,
      language: isArabic ? "ar" : "en",
    });
    setChecking(false);

    if (!result.success) {
      setError(actionError(result.error, t("failed")));
      return;
    }
    // Advice spends no allowance of its own: it counts with the car, on save.
    setReview(result.data);
  };

  const issueParams = { min: number(MIN_PHOTOS), good: number(GOOD_PHOTOS) };

  return (
    <section aria-labelledby="quality-title" className="rounded-control border border-border bg-field p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="quality-title" className="flex items-center gap-1.5 text-body font-semibold">
            <Gauge className="h-4 w-4" aria-hidden />
            {t("title")}
          </h3>
          <p className="mt-1 max-w-[60ch] text-caption text-muted-foreground">{t("body")}</p>
        </div>
        <Button type="button" variant="outline-strong" size="control" className="h-11 border bg-field" onClick={check} disabled={checking}>
          {checking ? (
            <Loader2 className="h-4 w-4 me-1.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4 me-1.5" aria-hidden />
          )}
          {checking ? t("checking") : review ? t("again") : t("check")}
        </Button>
      </div>

      {error && <p role="alert" className="mt-3 text-caption font-semibold text-destructive">{error}</p>}

      {review && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p className="text-body font-semibold">
            {t("score", { score: number(review.score), max: number(100) })}
          </p>

          {review.issues.length === 0 ? (
            <p className="text-caption font-semibold text-positive">{t("perfect")}</p>
          ) : (
            <ul className="space-y-2">
              {review.issues.map((issue) => (
                <li
                  key={issue.code}
                  className={`rounded-control border p-3 ${SEVERITY_STYLE[issue.severity]}`}
                >
                  <p className="text-caption font-semibold">
                    {t(`issues.${issue.code}`, issueParams)}
                  </p>
                  {issue.advice && (
                    // The advice is written in the dashboard's language.
                    <p className="mt-1.5 flex items-start gap-1.5 text-caption text-foreground/80">
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-[#a87200]" aria-hidden />
                      <span>{issue.advice}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {review.advice === "skipped" && (
            <p className="text-micro text-muted-foreground">{t("adviceSkipped")}</p>
          )}
        </div>
      )}
    </section>
  );
}
