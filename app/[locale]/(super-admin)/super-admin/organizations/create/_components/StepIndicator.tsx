"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { STEPS, type CreateDealershipState } from "./use-create-dealership";

/** Where the admin is in the three steps; the ones done can be gone back to. */
export function StepIndicator({
  step,
  values,
  place,
  goTo,
}: Pick<CreateDealershipState, "step" | "values" | "place" | "goTo">) {
  const t = useTranslations("superAdmin.organizations.form");
  const fmt = useFormatters();

  return (
    <>
      {/* Where you are: the three steps, the ones done can be gone back to. */}
      {/* Phones: a slim bar per step — the card below names the step and counts it. */}
      <div aria-hidden className="flex gap-1.5 sm:hidden">
        {STEPS.map((key, index) => (
          <span key={key} className={cn("h-1.5 flex-1 rounded-full", index < step ? "bg-positive" : index === step ? "bg-inverse" : "bg-muted")} />
        ))}
      </div>
      <ol aria-label={t("steps.label")} className="hidden grid-cols-3 gap-3 sm:grid">
        {STEPS.map((key, index) => {
          const done = index < step;
          const now = index === step;
          const inner = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-bold",
                  done ? "bg-positive text-white" : now ? "bg-inverse text-inverse-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : fmt.number(index + 1)}
              </span>
              <span className="min-w-0 text-start">
                <span className="block truncate font-semibold">{t(`steps.${key}`)}</span>
                <span className="block truncate text-micro text-muted-foreground">
                  {index === 0 && values.name ? [values.name, place()].filter(Boolean).join(fmt.locale === "ar" ? "، " : ", ") : null}
                  {index === 1 && values.ownerEmail ? values.ownerEmail : null}
                  {now ? t("steps.now") : null}
                </span>
              </span>
            </>
          );
          const box = cn(
            "flex w-full items-center gap-3 rounded-[14px] border bg-card px-4 py-2.5 text-caption",
            now ? "border-2 border-inverse" : "border-border",
          );
          return (
            <li key={key} aria-current={now ? "step" : undefined}>
              {done ? (
                <button type="button" onClick={() => goTo(index)} className={cn(box, "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
                  {inner}
                </button>
              ) : (
                <div className={box}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
