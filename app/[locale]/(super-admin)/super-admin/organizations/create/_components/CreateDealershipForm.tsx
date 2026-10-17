"use client";

import { useTranslations } from "next-intl";
import { CircleCheck, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { Field, inputClass } from "@/components/dashboard/form-ui";
import { useFormatters } from "@/hooks/use-formatters";
import { isValidSlug, normalizeSlugInput, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "@/lib/utils/slug";
import { tenantHost } from "@/lib/utils/tenant-host";
import { cn } from "@/lib/utils";
import { PlanStep } from "./PlanStep";
import { StepIndicator } from "./StepIndicator";
import { STEPS, useCreateDealership, type Plan, type Values } from "./use-create-dealership";

export function CreateDealershipForm({ plans }: { plans: Plan[] }) {
  const t = useTranslations("superAdmin.organizations.form");
  const fmt = useFormatters();
  const form = useCreateDealership(plans);
  const { step, values, errors, saving, heading, governorateOptions, cityOptions, slug, owner, slugTaken, set, setSlugEdited, validate, goTo, submit } = form;

  const optional = <span className="font-normal text-muted-foreground">{t("optional")}</span>;
  const describedBy = (key: keyof Values, hint = false) => (errors[key] ? `dealer-${key}-error` : hint ? `dealer-${key}-hint` : undefined);

  const slugHint = !values.slug ? t("slugHelp") : !isValidSlug(values.slug) ? t("slugInvalid", { min: SLUG_MIN_LENGTH, max: SLUG_MAX_LENGTH }) : slug.checking ? t("slugChecking") : slugTaken ? t("slugTaken") : slug.result?.available ? t("slugAvailable") : t("slugHelp");
  const slugGood = isValidSlug(values.slug) && slug.result?.available;
  const ownerHint = owner.checking
    ? t("ownerChecking")
    : owner.result?.hasAccount
      ? owner.result.name
        ? t("ownerExisting", { name: owner.result.name })
        : t("ownerExistingNoName")
      : owner.result
        ? t("ownerNew")
        : t("ownerHelp");

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator step={step} values={values} place={form.place} goTo={goTo} />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) {
            if (validate(step)) goTo(step + 1);
          } else submit();
        }}
        className="flex flex-col gap-6"
      >
        <section aria-labelledby="step-title" className="flex flex-col gap-5 rounded-[20px] border border-border bg-card px-4 py-5 sm:px-6">
          <div>
            <p className="text-micro text-muted-foreground">{t("steps.count", { current: fmt.number(step + 1), total: fmt.number(STEPS.length) })}</p>
            <h2 id="step-title" ref={heading} tabIndex={-1} className="text-[1.25rem] font-extrabold outline-none">
              {step === 2 ? t("plan.title") : t(`steps.${STEPS[step]}`)}
            </h2>
          </div>

          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="dealer-name" label={t("name")} error={errors.name}>
                <input id="dealer-name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} className={inputClass({ error: !!errors.name })} />
              </Field>
              <Field
                id="dealer-slug"
                label={t("slug")}
                error={errors.slug}
                hint={
                  <span className={cn("flex items-center gap-1.5", slugGood && "font-semibold text-positive", slugTaken && "font-semibold text-destructive")}>
                    {slug.checking && <Loader2 aria-hidden className="size-3 animate-spin" />}
                    {slugGood && <CircleCheck aria-hidden className="size-3.5" />}
                    {slugHint}
                  </span>
                }
              >
                <div className={cn(inputClass({ error: !!errors.slug || !!slugTaken }), "flex items-center gap-0 px-0 focus-within:ring-[3px] focus-within:ring-ring/50")} dir="ltr">
                  <input
                    id="dealer-slug"
                    value={values.slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      set("slug", normalizeSlugInput(e.target.value));
                    }}
                    aria-invalid={!!errors.slug || !!slugTaken}
                    aria-describedby={describedBy("slug", true)}
                    className="h-full min-w-0 flex-1 bg-transparent ps-3 text-body outline-none"
                  />
                  <span className="shrink-0 pe-3 text-muted-foreground">.{tenantHost("").replace(/^\./, "")}</span>
                </div>
              </Field>
              <Field id="dealer-region" label={t("region")} error={errors.region}>
                <SearchableLocationSelect
                  id="dealer-region"
                  value={values.region}
                  options={governorateOptions}
                  placeholder={t("regionPlaceholder")}
                  searchPlaceholder={t("search")}
                  emptyMessage={t("noResults")}
                  onValueChange={(value) => set("region", value)}
                  triggerClassName={inputClass({ error: !!errors.region })}
                />
              </Field>
              <Field id="dealer-city" label={t("city")} error={errors.city} hint={!values.region ? t("cityFirst") : undefined}>
                <SearchableLocationSelect
                  id="dealer-city"
                  value={values.city}
                  options={cityOptions}
                  placeholder={t("cityPlaceholder")}
                  searchPlaceholder={t("search")}
                  emptyMessage={t("noResults")}
                  disabled={!values.region}
                  onValueChange={(value) => set("city", value)}
                  triggerClassName={inputClass({ error: !!errors.city })}
                />
              </Field>
              <Field id="dealer-address" label={<>{t("address")} {optional}</>}>
                <input id="dealer-address" value={values.address} onChange={(e) => set("address", e.target.value)} placeholder={t("addressPlaceholder")} className={inputClass()} />
              </Field>
              <Field id="dealer-description" label={<>{t("description")} {optional}</>} className="md:col-span-2">
                <textarea
                  id="dealer-description"
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  rows={3}
                  className={cn(inputClass(), "h-auto py-2.5")}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="dealer-ownerEmail"
                label={t("ownerEmail")}
                error={errors.ownerEmail}
                hint={<span className={cn(owner.result?.hasAccount && "font-semibold text-positive")}>{ownerHint}</span>}
                className="md:col-span-2"
              >
                <input
                  id="dealer-ownerEmail"
                  type="email"
                  dir="ltr"
                  autoComplete="off"
                  value={values.ownerEmail}
                  onChange={(e) => set("ownerEmail", e.target.value)}
                  aria-invalid={!!errors.ownerEmail}
                  aria-describedby={describedBy("ownerEmail", true)}
                  className={cn(inputClass({ error: !!errors.ownerEmail }), "md:max-w-[calc(50%-0.5rem)]")}
                />
              </Field>
              <Field id="dealer-phone" label={<>{t("phone")} {optional}</>}>
                <input id="dealer-phone" type="tel" dir="ltr" value={values.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass()} />
              </Field>
              <Field id="dealer-email" label={<>{t("email")} {optional}</>} error={errors.email}>
                <input id="dealer-email" type="email" dir="ltr" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} className={inputClass({ error: !!errors.email })} />
              </Field>
              <Field id="dealer-website" label={<>{t("website")} {optional}</>}>
                <input id="dealer-website" type="url" dir="ltr" value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputClass()} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <PlanStep plans={plans} values={values} owner={owner} set={set} goTo={goTo} place={form.place} planName={form.planName} />
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="outline-strong" size="control" className="h-11 bg-field" onClick={() => goTo(step - 1)} disabled={saving}>
              {t("previous")}
            </Button>
          ) : (
            <Link href="/super-admin/organizations" className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "h-11 bg-field")}>
              {t("back")}
            </Link>
          )}
          <Button type="submit" variant="marker" size="control" className="h-11 min-w-[10rem]" disabled={saving}>
            {step < 2 ? t("next") : saving ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
