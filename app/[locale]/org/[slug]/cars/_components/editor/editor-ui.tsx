"use client";

import type { ComponentProps, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Field as BaseField, inputClass } from "../../../_components/form-ui";

export { inputClass };

/** Marks a value the AI read from the photos, until the dealer changes it. */
export function AiChip() {
  const t = useTranslations("org.carForm.editor.ai");
  return (
    <span
      title={t("chipLabel")}
      className="inline-flex h-5 items-center rounded-full bg-[#e7eef8] px-2 text-micro font-semibold text-[#1d4e9e]"
    >
      <span aria-hidden>{t("chip")}</span>
      <span className="sr-only">{t("chipLabel")}</span>
    </span>
  );
}

/** A field in the editor, marked when the AI filled it in. */
export function Field({ ai, ...props }: Omit<ComponentProps<typeof BaseField>, "badge"> & { ai?: boolean }) {
  return <BaseField {...props} badge={ai ? <AiChip /> : undefined} />;
}

/** A select in the editor's field style. `value` "" shows the placeholder. */
export function FieldSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  ai,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: boolean;
  ai?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-invalid={error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass({ error, ai }), "justify-between")}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72 rounded-control">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A question answered by tapping one card — a radio group, so arrow keys move
 * between the answers. The chosen card is outlined in asphalt on soft marker.
 */
export function ChoiceCards({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-control border bg-field px-4 text-body font-semibold transition-colors",
              "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
              checked ? "border-2 border-border-strong bg-marker-soft" : "border-[#8c8170] hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "size-[18px] shrink-0 rounded-full border-2",
                checked ? "border-[5px] border-border-strong" : "border-[#8c8170]",
              )}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

/** A question in a step: its heading, an optional line under it, and its answer. */
export function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border py-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-[1.0625rem] font-semibold">{title}</h3>
        {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** A titled block inside a step. */
export function StepSection({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-h3 font-semibold">{title}</h3>
        {lead && <p className="text-caption text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
