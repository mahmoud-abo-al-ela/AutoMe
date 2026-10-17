import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useActionError } from "@/hooks/use-action-error";
import { useEgyptLocations } from "@/hooks/use-egypt-locations";
import { useFormatters } from "@/hooks/use-formatters";
import { findCity, findGovernorate } from "@/lib/locations/data";
import { isValidSlug, slugFromName, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "@/lib/utils/slug";
import { checkDealershipSlug, checkOwnerEmail, createOrganization } from "@/actions/super-admin";
import { usePlanName } from "../../../_components/use-plan-name";

export type Plan = { id: string; type: string; name: string; monthlyPrice: number; maxCars: number; maxMembers: number; maxImagesPerCar: number };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STEPS = ["dealership", "owner", "plan"] as const;
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
export type Values = typeof empty;

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

export function useCreateDealership(plans: Plan[]) {
  const t = useTranslations("superAdmin.organizations.form");
  const actionError = useActionError();
  const fmt = useFormatters();
  const router = useRouter();
  const planName = usePlanName();
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

  return {
    step,
    values,
    errors,
    saving,
    heading,
    governorateOptions,
    cityOptions,
    slug,
    owner,
    slugTaken,
    set,
    setSlugEdited,
    place,
    planName,
    validate,
    goTo,
    submit,
  };
}

export type CreateDealershipState = ReturnType<typeof useCreateDealership>;
