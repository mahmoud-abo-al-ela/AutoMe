"use client";

import { useTranslations } from "next-intl";
import type { CarDetail } from "@/app/[locale]/(site)/cars/[id]/_lib/car-detail-types";

type Question = "available" | "price" | "visit" | "installments" | "tradeIn";

/**
 * One-tap first messages, as Facebook Marketplace offers "Is this still
 * available?". A blank box is where most first messages die. Questions the
 * dealership has already answered "no" to on its profile are not offered.
 */
export function QuickQuestions({
  car,
  disabled,
  onPick,
}: {
  car: CarDetail;
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  const t = useTranslations("chat.dock.quick");
  const dealer = car.organization;

  const questions: Question[] = [
    ...(car.status === "AVAILABLE" ? (["available"] as const) : []),
    "price",
    "visit",
    ...(dealer?.offersFinancing === false ? [] : (["installments"] as const)),
    ...(dealer?.acceptsTradeIn === false ? [] : (["tradeIn"] as const)),
  ];

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("label")}>
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(t(q))}
          className="cursor-pointer rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(q)}
        </button>
      ))}
    </div>
  );
}
