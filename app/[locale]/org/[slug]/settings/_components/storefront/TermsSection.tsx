"use client";

import { useTranslations } from "next-intl";
import { DEALERSHIP_TERM_FLAGS, UNSET, type TriStateFormValue } from "@/lib/utils/car-disclosures";
import { cn } from "@/lib/utils";
import { Field, inputClass } from "../../../_components/form-ui";
import { SectionPanel } from "../../../_components/SectionPanel";
import type { TermFlag, TermsState } from "./storefront-state";

const ANSWERS: TriStateFormValue[] = ["yes", "no", UNSET];

/**
 * The dealership's standing terms, each a Yes / No / Not stated choice. A
 * radio group rather than a dropdown: three answers fit on one line, and the
 * choice is visible without opening anything. "Not stated" is never read as
 * "no" — the assistant tells buyers to ask.
 */
export function TermsSection({ terms, onChange }: { terms: TermsState; onChange: (next: TermsState) => void }) {
  const t = useTranslations("org.settings.storefront.terms");

  return (
    <SectionPanel title={t("title")} hint={t("hint")}>
      <div className="flex flex-col divide-y divide-border">
        {DEALERSHIP_TERM_FLAGS.map((flag) => (
          <div key={flag} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
            <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <legend className="float-start mb-2 text-body sm:mb-0">{t(`fields.${flag}`)}</legend>
              <TriState name={flag} value={terms[flag]} onChange={(value) => onChange({ ...terms, [flag]: value })} />
            </fieldset>
            {flag === "offersFinancing" && terms.offersFinancing === "yes" && (
              <Field id="sf-financing" label={t("financingNote")}>
                <input
                  id="sf-financing"
                  value={terms.financingNote}
                  onChange={(event) => onChange({ ...terms, financingNote: event.target.value })}
                  maxLength={200}
                  placeholder={t("financingNotePlaceholder")}
                  dir={terms.financingNote ? "auto" : undefined}
                  className={inputClass()}
                />
              </Field>
            )}
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}

function TriState({ name, value, onChange }: { name: TermFlag; value: TriStateFormValue; onChange: (value: TriStateFormValue) => void }) {
  const t = useTranslations("org.settings.storefront.terms");
  return (
    <div className="grid w-full grid-cols-3 overflow-hidden rounded-control border border-[#8c8170] bg-field sm:w-auto">
      {ANSWERS.map((answer) => (
        <label
          key={answer}
          className={cn(
            "flex h-10 cursor-pointer items-center justify-center whitespace-nowrap border-s border-border px-3.5 text-caption font-semibold transition-colors first:border-s-0",
            "has-[:focus-visible]:relative has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
            value === answer ? "bg-inverse text-inverse-foreground" : "hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name={`term-${name}`}
            value={answer}
            checked={value === answer}
            onChange={() => onChange(answer)}
            className="sr-only"
          />
          {t(answer === UNSET ? "notStated" : answer)}
        </label>
      ))}
    </div>
  );
}
