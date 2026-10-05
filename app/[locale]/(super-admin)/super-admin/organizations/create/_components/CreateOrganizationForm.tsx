"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import {
  isValidSlug,
  normalizeSlugInput,
  slugFromName,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
} from "@/lib/utils/slug";
import { useRouter } from "@/i18n/navigation";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createOrganization } from "@/actions/super-admin";
import BasicInfoSection from "./BasicInfoSection";
import ContactInfoSection from "./ContactInfoSection";
import PlanSection from "./PlanSection";
import OwnerSection from "./OwnerSection";
import type { Plan } from "@/lib/generated/prisma";
import { planDisplayName } from "@/components/Pricing/pricing-plans";

/** The fields the create-organization form collects. All are strings, since
 * they come straight from text inputs and a plan Select. */
export type CreateOrganizationFormData = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  planId: string;
  ownerEmail: string;
};

/** What the three plain-input sections of this form each receive. */
export type CreateOrganizationSectionProps = {
  formData: CreateOrganizationFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

export default function CreateOrganizationForm({ plans }: { plans: Plan[] }) {
  const t = useTranslations("superAdmin.organizations.form");
  const tActions = useTranslations("common.actions");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const { number } = useFormatters();
  const tPlans = useTranslations("plans");
  const router = useRouter();
  // The slug follows the name until the admin types one.
  const [slugEdited, setSlugEdited] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<CreateOrganizationFormData>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    planId: plans[0]?.id || "",
    ownerEmail: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "slug") {
      setSlugEdited(true);
      setFormData((prev) => ({ ...prev, slug: normalizeSlugInput(value) }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Suggested from the name's Latin letters; an all-Arabic name suggests
      // nothing and the slug has to be typed. See lib/utils/slug.
      ...(name === "name" && !slugEdited ? { slug: slugFromName(value) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (!isValidSlug(formData.slug)) {
      toast.error(
        t("slugInvalid", {
          min: number(SLUG_MIN_LENGTH),
          max: number(SLUG_MAX_LENGTH),
        })
      );
      return;
    }

    if (!formData.planId) {
      toast.error(t("planRequired"));
      return;
    }

    startTransition(async () => {
      const result = await createOrganization(formData);

      if (result.success) {
        toast.success(t("created"), {
          description: t("createdBody", {
            name: formData.name,
            plan: (() => {
              const chosen = plans.find((p) => p.id === formData.planId);
              return chosen ? planDisplayName(tPlans, chosen) : "";
            })(),
          }),
        });
        router.push("/super-admin/organizations");
      } else {
        toast.error(t("createFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <BasicInfoSection formData={formData} onChange={handleChange} />
        <ContactInfoSection formData={formData} onChange={handleChange} />
        <PlanSection
          formData={formData}
          plans={plans}
          onPlanChange={(value) =>
            setFormData((prev) => ({ ...prev, planId: value }))
          }
        />
        <OwnerSection formData={formData} onChange={handleChange} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/super-admin/organizations")}
          disabled={isPending}
        >
          {tActions("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 me-2" />
              {t("submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
