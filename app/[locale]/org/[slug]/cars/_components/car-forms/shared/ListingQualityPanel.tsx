"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Gauge, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewListingQuality } from "@/actions/cars";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import { queryKeys } from "@/lib/query-client";
import { GOOD_PHOTOS, MIN_PHOTOS } from "@/lib/services/car/listing-quality";
import type { CarFormSectionProps } from "./section-props";

type Review = Extract<
  Awaited<ReturnType<typeof reviewListingQuality>>,
  { success: true }
>["data"];

const SEVERITY_STYLE = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-gray-200 bg-gray-50",
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
export default function ListingQualityPanel({ watch }: Pick<CarFormSectionProps, "watch">) {
  const t = useTranslations("org.carForm.coach");
  const { number } = useFormatters();
  const actionError = useActionError();
  const queryClient = useQueryClient();
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
    setReview(result.data);
    if (result.data.advice === "done") {
      // Advice spent an AI use; the allowance count elsewhere must not go stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("aiProcessing") });
    }
  };

  const issueParams = { min: number(MIN_PHOTOS), good: number(GOOD_PHOTOS) };

  return (
    <div className="mt-4 sm:mt-6 rounded-md border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-1.5 font-medium text-purple-800">
            <Gauge className="h-4 w-4" aria-hidden />
            {t("title")}
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-purple-700/80">{t("body")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={check} disabled={checking}>
          {checking ? (
            <Loader2 className="h-4 w-4 me-1.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4 me-1.5" aria-hidden />
          )}
          {checking ? t("checking") : review ? t("again") : t("check")}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {review && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p className="text-sm font-semibold text-gray-900">
            {t("score", { score: number(review.score), max: number(100) })}
          </p>

          {review.issues.length === 0 ? (
            <p className="text-sm text-green-700">{t("perfect")}</p>
          ) : (
            <ul className="space-y-2">
              {review.issues.map((issue) => (
                <li
                  key={issue.code}
                  className={`rounded-md border p-3 ${SEVERITY_STYLE[issue.severity]}`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {t(`issues.${issue.code}`, issueParams)}
                  </p>
                  {issue.advice && (
                    // The advice is written in the dashboard's language.
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs sm:text-sm text-gray-700">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" aria-hidden />
                      <span>{issue.advice}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {review.advice === "skipped" && (
            <p className="text-xs text-gray-500">{t("adviceSkipped")}</p>
          )}
        </div>
      )}
    </div>
  );
}
