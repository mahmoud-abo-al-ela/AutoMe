"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateEmailPreferences } from "@/actions/settings";
import { useActionError } from "@/hooks/use-action-error";
import type { EmailPreferencesInput } from "@/lib/validations/schemas";
import { cn } from "@/lib/utils";
import { SectionPanel } from "../../../_components/SectionPanel";

const LANGUAGES = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
] as const;

/**
 * The weekly summary email: on or off, and the language the dealership's
 * emails are written in. Only owners save — the summary goes to them.
 */
export function EmailSettings({ initial, canEdit }: { initial: EmailPreferencesInput; canEdit: boolean }) {
  const t = useTranslations("org.settings.weeklySummary");
  const actionError = useActionError();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = value.weeklyDigestEnabled !== saved.weeklyDigestEnabled || value.emailLocale !== saved.emailLocale;

  const save = async () => {
    setSaving(true);
    try {
      const response = await updateEmailPreferences(value);
      if (!response.success) return void toast.error(actionError(response.error, t("saveFailed")));
      setSaved(value);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      {!canEdit && (
        <p className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-caption">
          <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          {t("readOnly")}
        </p>
      )}
      <SectionPanel title={t("cardTitle")} hint={t("cardDescription")}>
        <fieldset disabled={!canEdit} className="flex flex-col divide-y divide-border">
          <label className="flex cursor-pointer items-start justify-between gap-4 pb-4">
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{t("enabledLabel")}</span>
              <span className="text-caption text-muted-foreground">{t("enabledHelp")}</span>
            </span>
            <Switch
              checked={value.weeklyDigestEnabled}
              onCheckedChange={(weeklyDigestEnabled) => setValue({ ...value, weeklyDigestEnabled })}
              className="mt-1 h-6 w-10 data-[state=checked]:bg-inverse [&>span]:size-5"
            />
          </label>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex flex-col gap-0.5">
              <span id="email-language" className="font-semibold">{t("languageLabel")}</span>
              <span className="text-caption text-muted-foreground">{t("languageHelp")}</span>
            </span>
            <div role="radiogroup" aria-labelledby="email-language" className="grid grid-cols-2 overflow-hidden rounded-control border border-[#8c8170] bg-field">
              {LANGUAGES.map((language) => (
                <label
                  key={language.value}
                  lang={language.value}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center border-s border-border px-5 text-caption font-semibold first:border-s-0",
                    "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                    value.emailLocale === language.value ? "bg-inverse text-inverse-foreground" : "hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="emailLocale"
                    value={language.value}
                    checked={value.emailLocale === language.value}
                    onChange={() => setValue({ ...value, emailLocale: language.value })}
                    className="sr-only"
                  />
                  {language.label}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      </SectionPanel>

      {canEdit && (
        <div className="flex justify-end">
          <Button variant="inverse" size="control" className="h-11 w-full sm:w-auto" disabled={!dirty || saving} onClick={save}>
            {saving && <Loader2 aria-hidden className="animate-spin" />}
            {t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
