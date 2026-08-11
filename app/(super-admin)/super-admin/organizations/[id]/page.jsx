import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import OrgDetailsHeader from "./_components/OrgDetailsHeader";
import OrgStats from "./_components/OrgStats";
import OrgMembers from "./_components/OrgMembers";
import OrgActivity from "./_components/OrgActivity";
import OrgSubscription from "./_components/OrgSubscription";

async function getOrganization(orgId) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      subscription: {
        include: { plan: true },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              role: true,
            },
          },
        },
        orderBy: { role: "asc" },
      },
      _count: {
        select: {
          cars: true,
          testDrives: true,
        },
      },
    },
  });

  if (!org) return null;

  // Get recent audit logs
  const recentActivity = await db.auditLog.findMany({
    where: { organizationId: orgId },
    take: 15,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, imageUrl: true },
      },
    },
  });

  // Get all plans for plan change dropdown
  const plans = await db.plan.findMany({
    orderBy: { monthlyPrice: "asc" },
  });

  return { org, recentActivity, plans };
}

export default async function OrganizationDetailsPage({ params }) {
  const { id } = await params;
  const data = await getOrganization(id);

  if (!data) {
    notFound();
  }

  const { org, recentActivity, plans } = data;

  return (
    <div className="space-y-6">
      <OrgDetailsHeader org={org} />
      <OrgStats org={org} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <OrgMembers memberships={org.memberships} orgId={org.id} />
          <OrgActivity activity={recentActivity} />
        </div>
        <div>
          <OrgSubscription
            subscription={org.subscription}
            plans={plans}
            orgId={org.id}
          />
        </div>
      </div>
    </div>
  );
}
