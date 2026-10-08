import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { getActivePlans } from "@/lib/services/super-admin/dealership-detail";
import { CreateDealershipForm } from "./_components/CreateDealershipForm";

/** Adding a dealership: the three-step form, with the plans to choose from. */
export default async function CreateDealershipPage() {
  const [plans, t] = await Promise.all([getActivePlans(), getTranslations("superAdmin.organizations.form")]);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/super-admin/organizations"
        className="flex w-fit items-center gap-1.5 rounded-control text-caption text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
        {t("back")}
      </Link>
      <OrgPageHeader title={t("title")} description={t("subtitle")} className="mb-0 md:mb-0" />
      <CreateDealershipForm plans={plans} />
    </div>
  );
}
