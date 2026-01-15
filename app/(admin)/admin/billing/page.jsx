import { checkUser } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingHeader from "./_components/BillingHeader";
import CurrentPlan from "./_components/CurrentPlan";
import PlanComparison from "./_components/PlanComparison";
import BillingHistory from "./_components/BillingHistory";

async function getSubscriptionData(organizationId) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription;
}

async function getAllPlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans;
}

async function getUsageStats(organizationId) {
  const [carCount, memberCount, testDriveCount] = await Promise.all([
    prisma.car.count({
      where: { organizationId },
    }),
    prisma.membership.count({
      where: { organizationId },
    }),
    prisma.testDrive.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(new Date().setDate(1)), // This month
        },
      },
    }),
  ]);

  return { carCount, memberCount, testDriveCount };
}

export default async function BillingPage() {
  const user = await checkUser();
  const organization = await getCurrentOrganization();

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  const [subscription, plans, usage] = await Promise.all([
    getSubscriptionData(organization.id),
    getAllPlans(),
    getUsageStats(organization.id),
  ]);

  return (
    <div className="space-y-8">
      <BillingHeader />

      <CurrentPlan
        subscription={subscription}
        usage={usage}
        isOwner={isOwner}
      />

      <PlanComparison
        plans={plans}
        currentPlanId={subscription?.planId}
        isOwner={isOwner}
        organizationId={organization.id}
      />

      {isOwner && <BillingHistory organizationId={organization.id} />}
    </div>
  );
}
