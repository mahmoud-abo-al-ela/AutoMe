"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
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
  const router = useRouter();
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
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("nameRequired"));
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
            plan: plans.find((p) => p.id === formData.planId)?.name ?? "",
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
