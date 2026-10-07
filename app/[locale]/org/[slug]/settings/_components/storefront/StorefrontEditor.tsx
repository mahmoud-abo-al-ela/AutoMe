"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { updateDealershipTerms, updateOrganizationProfile, updateWorkingHours } from "@/actions/settings";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import type { ActionResponse } from "@/lib/utils/response";
import { cn } from "@/lib/utils";
import { HoursSection } from "./HoursSection";
import { ProfileSection } from "./ProfileSection";
import { StorefrontPreview } from "./StorefrontPreview";
import { TermsSection } from "./TermsSection";
import {
  changedParts,
  hoursToInput,
  invalidDays,
  profileFromStored,
  termsToInput,
  type ProfileState,
  type StorefrontPart,
  type StorefrontState,
} from "./storefront-state";

type StoredProfile = Parameters<typeof profileFromStored>[0];

/** Each part saves through the action that already guards it (owners only). */
const SAVE: Record<StorefrontPart, (state: StorefrontState) => Promise<ActionResponse<unknown>>> = {
  profile: (state) => updateOrganizationProfile(state.profile),
  hours: (state) => updateWorkingHours(hoursToInput(state.hours)),
  terms: (state) => updateDealershipTerms(termsToInput(state.terms)),
};

/**
 * Settings' first tab: what buyers see (canvas: Settings round 1,
 * "2 · Storefront"). The profile, opening hours and terms are edited on the
 * left as one form with one Save, and the preview on the right shows the
 * result as it is typed. Members see it all, read-only: only owners can save.
 */
export function StorefrontEditor({ initial, logo, canEdit }: { initial: StorefrontState; logo: string | null; canEdit: boolean }) {
  const t = useTranslations("org.settings.storefront");
  const locale = useLocale();
  const actionError = useActionError();
  const [state, setState] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);

  const changed = useMemo(() => changedParts(state, saved), [state, saved]);
  const invalid = useMemo(() => invalidDays(state.hours), [state.hours]);
  const nameError = state.profile.name.trim().length < 2;
  const blocked = nameError || invalid.length > 0;
  const dirty = changed.length > 0;
  const list = (parts: StorefrontPart[]) =>
    new Intl.ListFormat(locale, { type: "conjunction" }).format(parts.map((part) => t(`save.parts.${part}`)));

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends StorefrontPart>(part: K) => (value: StorefrontState[K]) => setState((current) => ({ ...current, [part]: value }));

  /** Saves the changed parts side by side; each that succeeds becomes the new saved copy. */
  const save = async () => {
    if (blocked || saving) return;
    setSaving(true);
    const results = await Promise.all(
      changed.map(async (part) => {
        try {
          return { part, response: await SAVE[part](state) };
        } catch {
          return { part, response: null };
        }
      }),
    );
    setSaving(false);

    let nextSaved = saved;
    let storedProfile: ProfileState | null = null;
    const failed: StorefrontPart[] = [];
    let firstError: ActionError | undefined;
    for (const { part, response } of results) {
      if (response?.success) {
        // The profile comes back as the server stored it: trimmed, blanks emptied.
        if (part === "profile") storedProfile = profileFromStored(response.data as StoredProfile);
        nextSaved = { ...nextSaved, [part]: storedProfile && part === "profile" ? storedProfile : state[part] };
      } else {
        failed.push(part);
        firstError ??= response?.error;
      }
    }
    setSaved(nextSaved);
    if (storedProfile) setState((current) => ({ ...current, profile: storedProfile }));

    if (failed.length === 0) toast.success(t("save.saved"));
    else toast.error(actionError(firstError, t("save.failed", { parts: list(failed) })));
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="flex min-w-0 flex-col gap-5">
        {!canEdit && (
          <p className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-caption">
            <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {t("readOnly")}
          </p>
        )}

        {/* Disabled as a whole for members, so every field and choice is read-only at once. */}
        <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-5">
          <ProfileSection profile={state.profile} onChange={set("profile")} nameError={nameError} />
          <HoursSection hours={state.hours} onChange={set("hours")} invalid={invalid} />
          <TermsSection terms={state.terms} onChange={set("terms")} />
        </fieldset>

        {/* On a phone the preview waits behind a button, rather than a scroll past the form. */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline-strong" size="xl" className="lg:hidden">
              <Eye aria-hidden />
              {t("preview.show")}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-[20px] bg-background px-4 pb-6">
            <SheetHeader className="px-0">
              <SheetTitle>{t("preview.title")}</SheetTitle>
              <SheetDescription>{t("preview.lead")}</SheetDescription>
            </SheetHeader>
            <StorefrontPreview state={state} logo={logo} />
          </SheetContent>
        </Sheet>

        {canEdit && dirty && (
          <div
            role="region"
            aria-label={t("save.label")}
            className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl bg-inverse p-3 text-inverse-foreground shadow-lg sm:flex-row sm:items-center sm:px-4"
          >
            <p className="flex-1 text-caption font-semibold" aria-live="polite">
              {blocked ? t("save.fixFirst") : t("save.pending", { parts: list(changed) })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="control"
                className="h-11 flex-1 border border-[#8c8170] text-inverse-foreground hover:bg-white/10 hover:text-inverse-foreground sm:flex-none"
                disabled={saving}
                onClick={() => setState(saved)}
              >
                {t("save.discard")}
              </Button>
              <Button
                variant="marker"
                size="control"
                className={cn("h-11 flex-1 border-inverse-foreground sm:flex-none")}
                disabled={saving || blocked}
                onClick={save}
              >
                {saving && <Loader2 aria-hidden className="animate-spin" />}
                {saving ? t("save.saving") : t("save.save")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stuck just under the dashboard top bar: 113px tall below xl, where its links wrap to a second row, 72px from xl. */}
      <aside aria-label={t("preview.title")} className="sticky top-[137px] hidden flex-col gap-2 lg:flex xl:top-24">
        <p className="text-caption font-semibold">{t("preview.title")}</p>
        <StorefrontPreview state={state} logo={logo} />
      </aside>
    </div>
  );
}
