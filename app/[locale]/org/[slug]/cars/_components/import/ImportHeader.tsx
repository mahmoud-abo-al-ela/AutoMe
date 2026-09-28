"use client";

import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type { ImportStage } from "@/hooks/use-bulk-import";
import { MAX_IMPORT_PHOTOS } from "@/lib/constants/car-options";

const STEPS = ["upload", "review", "drafts"] as const;

/** Which of the three steps a stage belongs to. */
function stepOf(stage: ImportStage): number {
  if (stage === "pick" || stage === "grouping") return 0;
  if (stage === "review") return 1;
  return 2;
}

/**
 * The import's title, what the plan has left, and where the dealer is in the
 * three steps — so a long batch never leaves them wondering what comes next.
 */
export function ImportHeader({ stage, room, known }: { stage: ImportStage; room: number; known: boolean }) {
  const t = useTranslations("org.carForm.import");
  const { number } = useFormatters();
  const current = stepOf(stage);

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 p-2.5">
            <Sparkles className="h-6 w-6 text-purple-600" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{t("subtitle", { max: number(MAX_IMPORT_PHOTOS) })}</p>
          </div>
        </div>
        {known && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              room === 0 ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200" : "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {room === Infinity ? t("roomUnlimited") : t("room", { count: room, n: number(room) })}
          </span>
        )}
      </div>

      <ol className="flex items-center gap-2 sm:gap-3" aria-label={t("steps.label")}>
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-purple-600 text-white"
                    : active
                      ? "bg-purple-100 text-purple-700 ring-2 ring-purple-600"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : number(index + 1)}
              </span>
              <span className={`text-xs sm:text-sm ${active ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                {t(`steps.${step}`)}
              </span>
              {index < STEPS.length - 1 && (
                <span className={`hidden h-px flex-1 sm:block ${done ? "bg-purple-600" : "bg-gray-200"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}
