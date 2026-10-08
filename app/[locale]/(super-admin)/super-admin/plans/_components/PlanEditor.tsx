"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Field, inputClass } from "@/components/dashboard/form-ui";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { minorToMajor } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { updatePlanSettings } from "@/actions/super-admin";
import type { PlanRow } from "@/lib/services/super-admin/plans";
import { planFeatures, usePlanValues } from "./use-plan-values";

type Form = {
  monthlyPrice: string;
  yearlyPrice: string;
  trialDays: string;
  maxCars: string;
  carsUnlimited: boolean;
  maxMembers: string;
  teamUnlimited: boolean;
  maxImagesPerCar: string;
  activityDays: string;
  activityAlways: boolean;
  aiEnabled: boolean;
  aiLimit: string;
  aiUnlimited: boolean;
  aiAssistant: boolean;
  chat: boolean;
  prioritySupport: boolean;
};

const formFor = (plan: PlanRow): Form => {
  const f = planFeatures(plan);
  return {
    monthlyPrice: String(minorToMajor(plan.monthlyPrice)),
    yearlyPrice: String(minorToMajor(plan.yearlyPrice)),
    trialDays: String(plan.trialDays),
    maxCars: plan.maxCars < 0 ? "" : String(plan.maxCars),
    carsUnlimited: plan.maxCars < 0,
    maxMembers: plan.maxMembers < 0 ? "" : String(plan.maxMembers),
    teamUnlimited: plan.maxMembers < 0,
    maxImagesPerCar: String(plan.maxImagesPerCar),
    activityDays: plan.auditLogRetentionDays ? String(plan.auditLogRetentionDays) : "",
    activityAlways: !plan.auditLogRetentionDays,
    aiEnabled: f.aiProcessing.enabled,
    aiLimit: f.aiProcessing.limit < 0 ? "" : String(f.aiProcessing.limit),
    aiUnlimited: f.aiProcessing.limit < 0,
    aiAssistant: f.aiAssistant,
    chat: f.chat,
    prioritySupport: f.prioritySupport,
  };
};

/**
 * Editing one plan (canvas: Super admin plans round 1, "1 · Comparison
 * table"), in a panel beside the table: price, limits, and what is included.
 * "No limit" and "Always" are switches rather than a magic -1 to type. The
 * change applies to every dealership on the plan, which the panel says.
 */
export function PlanEditor({ plan, onClose }: { plan: PlanRow | null; onClose: () => void }) {
  const t = useTranslations("superAdmin.plans.editor");
  const tCommon = useTranslations("superAdmin.common");
  const tActions = useTranslations("common.actions");
  const actionError = useActionError();
  const fmt = useFormatters();
  const values = usePlanValues();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<Form | null>(plan ? formFor(plan) : null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [shownFor, setShownFor] = useState(plan?.id);

  // A different plan opened: start from its saved settings.
  if (plan && plan.id !== shownFor) {
    setShownFor(plan.id);
    setForm(formFor(plan));
    setErrors({});
  }
  if (!plan || !form) return null;
  const name = values.name(plan);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /** A whole number in a range, or an error message for the field. */
  const whole = (raw: string, min: number, max: number): number | string => {
    if (!/^\d+$/.test(raw.trim())) return t("errors.whole");
    const n = Number(raw);
    if (n < min) return t("errors.atLeast", { min: fmt.number(min) });
    if (n > max) return t("errors.atMost", { max: fmt.number(max) });
    return n;
  };
  /** A price in EGP with up to two decimals, as piasters. */
  const price = (raw: string, max: number): number | string => {
    if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return t("errors.whole");
    const minor = Math.round(Number(raw) * 100);
    return minor > max ? t("errors.atMost", { max: fmt.number(max / 100) }) : minor;
  };

  const save = async () => {
    const checks: [keyof Form, number | string][] = [
      ["monthlyPrice", price(form.monthlyPrice, 100_000_000)],
      ["yearlyPrice", price(form.yearlyPrice, 1_000_000_000)],
      ["trialDays", whole(form.trialDays, 0, 365)],
      ["maxCars", form.carsUnlimited ? -1 : whole(form.maxCars, 1, 100_000)],
      ["maxMembers", form.teamUnlimited ? -1 : whole(form.maxMembers, 1, 100_000)],
      ["maxImagesPerCar", whole(form.maxImagesPerCar, 1, 100)],
      ["activityDays", form.activityAlways ? 0 : whole(form.activityDays, 1, 3650)],
      ["aiLimit", !form.aiEnabled || form.aiUnlimited ? -1 : whole(form.aiLimit, 0, 100_000)],
    ];
    const found = Object.fromEntries(checks.filter(([, v]) => typeof v === "string")) as Partial<Record<keyof Form, string>>;
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(`plan-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    const n = Object.fromEntries(checks) as Record<string, number>;
    setSaving(true);
    try {
      const result = await updatePlanSettings(plan.id, {
        monthlyPrice: n.monthlyPrice,
        yearlyPrice: n.yearlyPrice,
        trialDays: n.trialDays,
        maxCars: n.maxCars,
        maxMembers: n.maxMembers,
        maxImagesPerCar: n.maxImagesPerCar,
        auditLogRetentionDays: form.activityAlways ? null : n.activityDays,
        aiProcessing: { enabled: form.aiEnabled, limit: form.aiEnabled ? n.aiLimit : planFeatures(plan).aiProcessing.limit },
        aiAssistant: form.aiAssistant,
        chat: form.chat,
        prioritySupport: form.prioritySupport,
      });
      if (result.success) {
        toast.success(t("saved", { plan: name }), { description: t("savedBody", { plan: name }) });
        onClose();
        startTransition(() => router.refresh());
      } else {
        toast.error(t("failed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const number = (key: keyof Form, label: string, opts: { hint?: string; disabled?: boolean; unlimited?: { key: keyof Form; label: string } } = {}) => (
    <Field id={`plan-${key}`} label={label} error={errors[key]} hint={opts.hint}>
      <div className="flex items-center gap-3">
        <input
          id={`plan-${key}`}
          inputMode="decimal"
          dir="ltr"
          value={form[key] as string}
          disabled={opts.disabled}
          onChange={(event) => set(key, event.target.value as never)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `plan-${key}-error` : opts.hint ? `plan-${key}-hint` : undefined}
          className={cn(inputClass({ error: !!errors[key] }), "tabular-nums")}
        />
        {opts.unlimited && (
          <label className="flex shrink-0 items-center gap-2 text-caption">
            <Switch checked={form[opts.unlimited.key] as boolean} onCheckedChange={(on) => set(opts.unlimited!.key, on as never)} />
            {opts.unlimited.label}
          </label>
        )}
      </div>
    </Field>
  );
  const toggle = (key: keyof Form, label: string) => (
    <label className="flex min-h-11 items-center justify-between gap-4 text-body">
      {label}
      <Switch checked={form[key] as boolean} onCheckedChange={(on) => set(key, on as never)} />
    </label>
  );
  const section = "flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0";

  return (
    <Sheet open onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent side={fmt.locale === "ar" ? "left" : "right"} className="flex w-full flex-col gap-0 bg-card p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="text-[1.25rem] font-extrabold">{t("title", { plan: name })}</SheetTitle>
          <SheetDescription className="text-caption">
            {t("note", { value: fmt.number(plan.dealerships.total) })} {t("lastChanged", { date: fmt.date(plan.updatedAt) })}
          </SheetDescription>
        </SheetHeader>

        <form
          id="plan-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        >
          <section className={section}>
            <h3 className="text-body font-bold">{t("price")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {number("monthlyPrice", t("monthly"))}
              {number("yearlyPrice", t("yearly"))}
              {number("trialDays", t("trial"), { hint: t("trialHint") })}
            </div>
          </section>
          <section className={section}>
            <h3 className="text-body font-bold">{t("limits")}</h3>
            {number("maxCars", t("cars"), { disabled: form.carsUnlimited, unlimited: { key: "carsUnlimited", label: t("noLimit") } })}
            {number("maxMembers", t("team"), { disabled: form.teamUnlimited, unlimited: { key: "teamUnlimited", label: t("noLimit") } })}
            {number("maxImagesPerCar", t("photos"))}
            {number("activityDays", t("activity"), { disabled: form.activityAlways, unlimited: { key: "activityAlways", label: t("always") } })}
          </section>
          <section className={section}>
            <h3 className="text-body font-bold">{t("included")}</h3>
            {toggle("aiEnabled", t("aiListing"))}
            {form.aiEnabled && number("aiLimit", t("aiLimit"), { disabled: form.aiUnlimited, unlimited: { key: "aiUnlimited", label: t("noLimit") } })}
            {toggle("aiAssistant", t("aiAssistant"))}
            {toggle("chat", t("chat"))}
            {toggle("prioritySupport", t("priority"))}
          </section>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="outline-strong" size="control" className="h-11 bg-field" onClick={onClose} disabled={saving}>
            {tActions("cancel")}
          </Button>
          <Button type="submit" form="plan-form" variant="marker" size="control" className="h-11" disabled={saving}>
            {saving ? t("saving") : t("save", { plan: name })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
