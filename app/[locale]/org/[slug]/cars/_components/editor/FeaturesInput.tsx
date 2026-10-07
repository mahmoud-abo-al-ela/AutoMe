"use client";

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiChip } from "./editor-ui";

/** A comma in either script ends a feature, as Enter does. */
const SEPARATOR = /[,،]/;

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;

/**
 * The car's features as tags: typed and added with Enter or a comma, removed
 * with their ✕ (or Backspace in an empty box), and the common ones a tap away
 * underneath. Replaces the comma-separated text box, where one wrong comma —
 * an Arabic "،" for a "," — ran two features together.
 */
export function FeaturesInput({
  id,
  label,
  value,
  onChange,
  ai,
  dir,
  lang,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (features: string[]) => void;
  ai?: boolean;
  dir: "ltr" | "rtl";
  lang: string;
}) {
  const t = useTranslations("org.carForm.editor.features");
  const [draft, setDraft] = useState("");
  const suggestions = (t.raw("suggestions") as string[]).filter((suggestion) => !value.some((feature) => same(feature, suggestion)));

  const add = (text: string) => {
    const additions = text
      .split(SEPARATOR)
      .map((part) => part.trim())
      .filter((part) => part && !value.some((feature) => same(feature, part)));
    if (additions.length > 0) onChange([...value, ...additions]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="flex items-center gap-2 text-caption font-semibold">
          {label}
          {ai && <AiChip />}
        </label>
        <div
          dir={dir}
          className={cn(
            "flex min-h-11 flex-wrap items-center gap-1.5 rounded-control border bg-field px-2 py-1.5",
            "focus-within:ring-[3px] focus-within:ring-ring/50",
            ai ? "border-[#1d4e9e] bg-[#f5f8fd]" : "border-[#8c8170]",
          )}
        >
          {value.map((feature, index) => (
            <span key={`${feature}-${index}`} className="flex h-8 items-center gap-1 rounded-full bg-muted pe-1 ps-3 text-caption">
              <bdi>{feature}</bdi>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label={t("remove", { feature })}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            lang={lang}
            onChange={(event) => {
              // A comma typed or pasted ends the feature before it.
              if (SEPARATOR.test(event.target.value)) add(event.target.value);
              else setDraft(event.target.value);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => draft.trim() && add(draft)}
            placeholder={t("placeholder")}
            aria-describedby={`${id}-hint`}
            className="h-8 min-w-32 flex-1 bg-transparent px-1 text-body outline-none placeholder:text-muted-foreground"
          />
        </div>
        <p id={`${id}-hint`} className="text-micro text-muted-foreground">
          {t("hint")}
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-caption font-semibold">{t("suggestionsLabel")}</p>
          <ul dir={dir} className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => onChange([...value, suggestion])}
                  aria-label={t("add", { feature: suggestion })}
                  className="flex h-9 cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#8c8170] bg-field ps-2.5 pe-3 text-caption hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Plus aria-hidden className="size-3.5" />
                  <bdi>{suggestion}</bdi>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
