import { getTranslations } from "next-intl/server";
import { db } from "@/lib/prisma";
import CreateOrganizationForm from "./_components/CreateOrganizationForm";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

async function getPlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });
}

export default async function CreateOrganizationPage() {
  const plans = await getPlans();
  const t = await getTranslations("superAdmin.organizations.form");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Styles on the Link, not <Button asChild>: in a server component
            Radix Slot 1.2.2 can receive the link as a lazy element and render
            nothing. */}
        <Link
          href="/super-admin/organizations"
          aria-label={t("back")}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Form */}
      <CreateOrganizationForm plans={plans} />
    </div>
  );
}
