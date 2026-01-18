import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { getBillingData } from "@/lib/services/billing";
import BillingHeader from "./_components/BillingHeader";
import CurrentPlan from "./_components/CurrentPlan";
import PlanComparison from "./_components/PlanComparison";
import BillingHistory from "./_components/BillingHistory";

export default async function BillingPage({ params }) {
  const { slug } = await params;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  const { subscription, plans, usage } = await getBillingData(organization.id);

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
