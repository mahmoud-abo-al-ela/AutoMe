"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { CAR_STEPS, type CarStep } from "@/hooks/use-car-form";
import { cn } from "@/lib/utils";

/**
 * The steps down the side (lg and up): done ones ticked with what they hold
 * and a way back, the current one in marker yellow, the rest ahead. When
 * editing every step is open. On a phone the rail gives way to a single
 * "Step 2 of 4" line with a bar (StepHeading).
 */
export function StepRail({
  current,
  reached,
  summaries,
  complete = false,
  onGo,
}: {
  current: CarStep;
  reached: number;
  summaries: Partial<Record<CarStep, string>>;
  /** An existing car: every step already holds its answers. */
  complete?: boolean;
  onGo: (step: CarStep) => void;
}) {
  const t = useTranslations("org.carForm.editor");
  const fmt = useFormatters();

  return (
    <ol aria-label={t("stepsLabel")} className="flex flex-col">
      {CAR_STEPS.map((step, index) => {
        const isCurrent = step === current;
        // Passed on the way to the furthest step reached; that step itself is open but not yet done.
        const done = !isCurrent && (complete || index < reached);
        const open = !isCurrent && index <= reached;
        return (
          <li key={step} aria-current={isCurrent ? "step" : undefined} className="relative flex gap-3.5 pb-6 last:pb-0">
            {index < CAR_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn("absolute start-[15px] top-[34px] bottom-1 w-0.5", index < reached ? "bg-border-strong" : "bg-border")}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-caption font-semibold",
                isCurrent
                  ? "border-border-strong bg-marker text-marker-foreground"
                  : done
                    ? "border-border-strong bg-inverse text-inverse-foreground"
                    : "border-[#8c8170] bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : fmt.number(index + 1)}
            </span>
            <span className="flex min-w-0 flex-col pt-1">
              {open ? (
                <button
                  type="button"
                  onClick={() => onGo(step)}
                  className="cursor-pointer text-start text-body font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-[6px]"
                >
                  {t(`steps.${step}`)}
                </button>
              ) : (
                <span className={cn("text-body font-semibold", !isCurrent && "text-muted-foreground")}>{t(`steps.${step}`)}</span>
              )}
              {summaries[step] && <span className="text-caption text-muted-foreground">{summaries[step]}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Above the step on every width: where the dealer is, and on a phone a bar for how far. */
export function StepHeading({ current }: { current: CarStep }) {
  const t = useTranslations("org.carForm.editor");
  const fmt = useFormatters();
  const index = CAR_STEPS.indexOf(current);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption text-muted-foreground">
        {t("stepOf", { current: fmt.number(index + 1), total: fmt.number(CAR_STEPS.length) })}
      </p>
      <span aria-hidden className="mb-2 block h-1 overflow-hidden rounded-full bg-border lg:hidden">
        <span className="block h-full rounded-full bg-border-strong transition-[width]" style={{ width: `${((index + 1) / CAR_STEPS.length) * 100}%` }} />
      </span>
      <h2 id="step-title" tabIndex={-1} className="text-h2 font-extrabold leading-tight outline-none">{t(`steps.${current}`)}</h2>
    </div>
  );
}
