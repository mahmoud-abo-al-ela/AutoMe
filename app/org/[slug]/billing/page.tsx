import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { getBillingData } from "@/lib/services/billing";
import BillingHeader from "./_components/BillingHeader";
import SubscriptionAlert from "./_components/SubscriptionAlert";
import CurrentPlan from "./_components/CurrentPlan";
import PaymentMethod from "./_components/PaymentMethod";
import PlanComparison from "./_components/PlanComparison";
import BillingHistory from "./_components/BillingHistory";
import InvoiceHistory from "./_components/InvoiceHistory";
import NonOwnerBillingNotice from "./_components/NonOwnerBillingNotice";

/**
 * Get the organization owner's name and email for non-owner contact info
 */
async function getOrganizationOwner(organizationId: string) {
  const ownerMembership = await db.membership.findFirst({
    where: {
      organizationId,
      role: "OWNER",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return ownerMembership?.user || null;
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  // The org layout redirects to /sign-in when there is no user, so this page
  // is only reachable with one.
  const membership = await getUserMembership(user!.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  const { subscription, plans, usage } = await getBillingData(organization.id);

  // For non-owners, fetch the owner's contact info
  const owner = !isOwner
    ? await getOrganizationOwner(organization.id)
    : null;

  return (
    <div className="space-y-8">
      <BillingHeader />

      {/* Non-owner notice */}
      {!isOwner && (
        <NonOwnerBillingNotice
          ownerName={owner?.name}
          ownerEmail={owner?.email}
        />
      )}

      <SubscriptionAlert
        subscription={subscription}
        isOwner={isOwner}
        organizationId={organization.id}
      />

      <CurrentPlan
        subscription={subscription}
        usage={usage}
        isOwner={isOwner}
        organizationId={organization.id}
      />

      {isOwner && (
        <PaymentMethod
          organizationId={organization.id}
          isOwner={isOwner}
        />
      )}

      {isOwner && (
        <PlanComparison
          plans={plans}
          currentPlanId={subscription?.planId}
          isOwner={isOwner}
          organizationId={organization.id}
        />
      )}

      {isOwner && <InvoiceHistory organizationId={organization.id} />}

      {isOwner && <BillingHistory organizationId={organization.id} />}
    </div>
  );
}
