"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { Field, inputClass } from "@/components/dashboard/form-ui";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useActionError } from "@/hooks/use-action-error";
import { useEgyptLocations } from "@/hooks/use-egypt-locations";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { findCity, findGovernorate } from "@/lib/locations/data";
import { isValidSlug, normalizeSlugInput, slugFromName, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "@/lib/utils/slug";
import { tenantHost } from "@/lib/utils/tenant-host";
import { cn } from "@/lib/utils";
import { checkDealershipSlug, checkOwnerEmail, createOrganization } from "@/actions/super-admin";

type Plan = { id: string; type: string; name: string; monthlyPrice: number; maxCars: number; maxMembers: number; maxImagesPerCar: number };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = ["dealership", "owner", "plan"] as const;
const FIELDS_BY_STEP: string[][] = [["name", "slug", "region", "city"], ["ownerEmail", "email"], ["planId"]];

const empty = {
  name: "",
  slug: "",
  description: "",
  region: "",
  city: "",
  address: "",
  ownerEmail: "",
  phone: "",
  email: "",
  website: "",
  planId: "",
};
type Values = typeof empty;

/** Runs `check` on `value` once it has settled for a moment, and keeps the latest answer. */
function useLookup<T>(value: string, enabled: boolean, check: (value: string) => Promise<T | null>) {
  const [state, setState] = useState<{ for: string; result: T | null } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    const timer = setTimeout(async () => {
      const result = await check(value).catch(() => null);
      if (current) setState({ for: value, result });
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [value, enabled, check]);
  const settled = state?.for === value;
  return { checking: enabled && !settled, result: enabled && settled ? state.result : null };
}

const lookupSlug = async (slug: string) => {
  const result = await checkDealershipSlug(slug);
  return result.success ? result.data : null;
};
const lookupOwner = async (email: string) => {
  const result = await checkOwnerEmail(email);
  return result.success ? result.data : null;
};

/**
 * Adding a dealership (canvas: Super admin add a dealership round 1, "B ·
 * Three steps"): the dealership and where it is, then the owner and how to
 * reach it, then the plan with every answer to check. The web address and the
 * owner's email are checked as they are typed — whether the address is free,
 * and whether the owner already has an account and so becomes the owner now.
 */
export function CreateDealershipForm({ plans }: { plans: Plan[] }) {
  const t = useTranslations("superAdmin.organizations.form");
  const tPlan = useTranslations("superAdmin.organizations.details.plans");
  const tPlans = useTranslations("plans");
  const actionError = useActionError();
  const fmt = useFormatters();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ ...empty, planId: plans.find((p) => p.type === "STARTER")?.id ?? plans[0]?.id ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const { governorateOptions, cityOptions } = useEgyptLocations(values.region || null);

  const slug = useLookup(values.slug, isValidSlug(values.slug), lookupSlug);
  const owner = useLookup(values.ownerEmail.trim().toLowerCase(), EMAIL.test(values.ownerEmail.trim()), lookupOwner);
  const slugTaken = slug.result?.valid && !slug.result.available;

  const set = (key: keyof Values, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
      // The web address follows the name until the admin types one.
      ...(key === "name" && !slugEdited ? { slug: slugFromName(value) } : {}),
      ...(key === "region" ? { city: "" } : {}),
    }));
    // Editing a field clears its error; a name that fills in the web address clears that one too.
    setErrors((prev) => ({ ...prev, [key]: undefined, ...(key === "name" && !slugEdited ? { slug: undefined } : {}) }));
  };

  const planName = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const place = () => {
    const label = (entry: { en: string; ar: string } | undefined) => (entry ? (fmt.locale === "ar" ? entry.ar : entry.en) : null);
    return [label(findCity(values.city)), label(findGovernorate(values.region))].filter(Boolean).join(fmt.locale === "ar" ? "، " : ", ");
  };

  const validate = (index: number) => {
    const next: Partial<Record<keyof Values, string>> = {};
    if (index === 0) {
      if (values.name.trim().length < 2) next.name = t("errors.name");
      if (!values.slug) next.slug = t("errors.slug");
      else if (!isValidSlug(values.slug)) next.slug = t("slugInvalid", { min: SLUG_MIN_LENGTH, max: SLUG_MAX_LENGTH });
      else if (slugTaken) next.slug = t("slugTaken");
      if (!values.region) next.region = t("errors.region");
      if (!values.city) next.city = t("errors.city");
    }
    if (index === 1) {
      if (!values.ownerEmail.trim()) next.ownerEmail = t("errors.owner");
      else if (!EMAIL.test(values.ownerEmail.trim())) next.ownerEmail = t("errors.emailFormat");
      if (values.email.trim() && !EMAIL.test(values.email.trim())) next.email = t("errors.emailFormat");
    }
    if (index === 2 && !values.planId) next.planId = t("errors.plan");
    setErrors(next);
    const first = FIELDS_BY_STEP[index].find((key) => next[key as keyof Values]);
    if (first) document.getElementById(`dealer-${first}`)?.focus();
    return !first;
  };

  const goTo = (index: number) => {
    setStep(index);
    requestAnimationFrame(() => heading.current?.focus());
  };

  const submit = async () => {
    if (!validate(0)) return goTo(0);
    if (!validate(1)) return goTo(1);
    if (!validate(2)) return;
    setSaving(true);
    try {
      const result = await createOrganization({ ...values, ownerEmail: values.ownerEmail.trim().toLowerCase() });
      if (result.success) {
        const plan = plans.find((p) => p.id === values.planId);
        toast.success(t("created"), { description: t("createdBody", { name: values.name, plan: plan ? planName(plan) : "" }) });
        router.push(`/super-admin/organizations/${result.data.organization.id}`);
      } else {
        toast.error(t("createFailed"), { description: actionError(result.error, "") || undefined });
        setSaving(false);
      }
    } catch {
      toast.error(t("createFailed"));
      setSaving(false);
    }
  };

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
            <>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-caption text-muted-foreground">{t("plan.hint")}</legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {plans.map((plan) => {
                    const on = plan.id === values.planId;
                    return (
                      <label
                        key={plan.id}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-[16px] border bg-field px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                          on ? "border-2 border-[#1d4e9e] bg-[#f3f6fb]" : "border-border hover:bg-muted/40",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <input type="radio" name="plan" value={plan.id} checked={on} onChange={() => set("planId", plan.id)} className="size-[18px] accent-[#1d4e9e]" />
                          <span className="text-body font-bold">{planName(plan)}</span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          {plan.monthlyPrice > 0 ? tPlan("perMonthPrice", { amount: formatPlanAmount(plan.monthlyPrice, fmt.locale) }) : tPlan("free")}
                        </span>
                        <span className="text-micro text-muted-foreground">
                          {plan.maxCars < 0 ? tPlan("carsUnlimited") : tPlan("cars", { value: fmt.number(plan.maxCars) })}
                        </span>
                        <span className="text-micro text-muted-foreground">
                          {plan.maxMembers < 0 ? tPlan("peopleUnlimited") : tPlan("people", { value: fmt.number(plan.maxMembers) })}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="border-t border-border pt-5">
                <h3 className="text-body font-bold">{t("review.title")}</h3>
                <dl className="mt-3 flex flex-col">
                  {(
                    [
                      ["name", values.name, 0],
                      ["slug", tenantHost(values.slug), 0, true],
                      ["where", [values.address, place()].filter(Boolean).join(fmt.locale === "ar" ? "، " : ". "), 0],
                      ["about", values.description, 0],
                      [
                        "owner",
                        values.ownerEmail &&
                          (owner.result?.hasAccount ? t("review.ownerExisting", { email: values.ownerEmail }) : t("review.ownerNew", { email: values.ownerEmail })),
                        1,
                      ],
                      ["contact", [values.phone, values.email, values.website].filter(Boolean).join(fmt.locale === "ar" ? "، " : ", "), 1, true],
                    ] as [string, string, number, boolean?][]
                  ).map(([key, value, target, ltr]) => (
                    <div key={key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-start gap-3 border-b border-border py-2.5 text-caption last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
                      <dt className="text-muted-foreground">{t(`review.${key}`)}</dt>
                      <dd className={cn("min-w-0 break-words", !value && "text-muted-foreground")} dir={ltr && value ? "ltr" : undefined}>
                        {value || t("review.none")}
                      </dd>
                      <button
                        type="button"
                        onClick={() => goTo(target)}
                        aria-label={t("review.changeLabel", { field: t(`review.${key}`) })}
                        className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
                      >
                        {t("review.change")}
                      </button>
                    </div>
                  ))}
                </dl>
              </div>
            </>
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
