import { db } from "@/lib/prisma";
import CreateOrganizationForm from "./_components/CreateOrganizationForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getPlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });
}

export default async function CreateOrganizationPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/super-admin/organizations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Organization
          </h1>
          <p className="text-muted-foreground">
            Set up a new organization on the platform
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateOrganizationForm plans={plans} />
    </div>
  );
}
