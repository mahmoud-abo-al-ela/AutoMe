"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { MonthPicker } from "@/components/common/MonthPicker";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarFormValues } from "@/hooks/use-car-form";
import { SERVICE_HISTORY, UNSET } from "@/lib/utils/car-disclosures";
import { ChoiceCards, Question } from "./editor-ui";

/** "6" stands for six or more, as the stored owner count does. */
const MAX_OWNERS = 6;

/**
 * Step 3: what buyers ask first — repaint, accidents, owners, service, the
 * licence. One question at a time, answered with a tap. Every one is optional
 * and "Not stated" is a real answer: the listing shows nothing for it, and the
 * buyer assistant declines rather than guessing.
 *
 * The questions are asked the way buyers ask them ("has any panel been
 * repainted?"), so "No" there is original paint — the stored field.
 */
export function HistoryStep({ form }: { form: UseFormReturn<CarFormValues> }) {
  const t = useTranslations("org.carForm");
  const fmt = useFormatters();
  const { watch, setValue } = form;
  // Each of these holds a choice string ("yes", "no", UNSET, an owner count, a month).
  const set = (field: "originalPaint" | "accidentFree" | "ownerCount" | "serviceHistory" | "licenseValidUntil", value: string) =>
    setValue(field, value as never, { shouldDirty: true });

  const owners = watch("ownerCount") ?? UNSET;
  const ownerCount = owners === UNSET ? 0 : Number(owners);
  const ownersLabel =
    ownerCount === 0
      ? t("condition.notStated")
      : ownerCount >= MAX_OWNERS
        ? t("condition.ownersOrMore", { value: fmt.number(MAX_OWNERS) })
        : t("condition.owners", { count: ownerCount, value: fmt.number(ownerCount) });
  const setOwners = (count: number) => set("ownerCount", count <= 0 ? UNSET : String(Math.min(count, MAX_OWNERS)));

  return (
    <div className="flex flex-col">
      <Question title={t("editor.history.repaint.question")} hint={t("editor.history.repaint.hint")}>
        <ChoiceCards
          name="originalPaint"
          label={t("editor.history.repaint.question")}
          value={watch("originalPaint") ?? UNSET}
          onChange={(value) => set("originalPaint", value)}
          options={[
            { value: "yes", label: t("editor.history.repaint.original") },
            { value: "no", label: t("editor.history.repaint.repainted") },
            { value: UNSET, label: t("condition.notStated") },
          ]}
        />
      </Question>

      <Question title={t("editor.history.accident.question")}>
        <ChoiceCards
          name="accidentFree"
          label={t("editor.history.accident.question")}
          value={watch("accidentFree") ?? UNSET}
          onChange={(value) => set("accidentFree", value)}
          options={[
            { value: "yes", label: t("editor.history.accident.none") },
            { value: "no", label: t("editor.history.accident.had") },
            { value: UNSET, label: t("condition.notStated") },
          ]}
        />
      </Question>

      <Question title={t("editor.history.owners.question")}>
        <div className="inline-flex w-fit items-stretch overflow-hidden rounded-control border border-[#8c8170] bg-field">
          <button
            type="button"
            onClick={() => setOwners(ownerCount - 1)}
            disabled={ownerCount === 0}
            aria-label={t("editor.history.owners.fewer")}
            className="flex size-12 cursor-pointer items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
          >
            <Minus aria-hidden className="size-4" />
          </button>
          <output aria-live="polite" className="flex min-w-40 items-center justify-center border-x border-border px-4 text-body font-semibold">
            {ownersLabel}
          </output>
          <button
            type="button"
            onClick={() => setOwners(ownerCount + 1)}
            disabled={ownerCount >= MAX_OWNERS}
            aria-label={t("editor.history.owners.more")}
            className="flex size-12 cursor-pointer items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
          >
            <Plus aria-hidden className="size-4" />
          </button>
        </div>
      </Question>

      <Question title={t("editor.history.service.question")}>
        <ChoiceCards
          name="serviceHistory"
          label={t("editor.history.service.question")}
          value={watch("serviceHistory") ?? UNSET}
          onChange={(value) => set("serviceHistory", value)}
          options={[
            ...SERVICE_HISTORY.map((value) => ({ value, label: t(`condition.service.${value}`) })),
            { value: UNSET, label: t("condition.notStated") },
          ]}
        />
      </Question>

      <Question title={t("editor.history.licence.question")}>
        <div className="w-full max-w-xs">
          <MonthPicker
            id="licenseValidUntil"
            value={watch("licenseValidUntil") ?? ""}
            onChange={(value) => set("licenseValidUntil", value)}
            placeholder={t("condition.notStated")}
            clearLabel={t("condition.monthPicker.clear")}
            previousYearLabel={t("condition.monthPicker.previousYear")}
            nextYearLabel={t("condition.monthPicker.nextYear")}
          />
        </div>
      </Question>
    </div>
  );
}
