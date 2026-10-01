import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { getBillingData } from "@/lib/services/billing";
import BillingHeader from "./_components/BillingHeader";
import RenewalBanner from "./_components/RenewalBanner";
import CurrentPlan from "./_components/CurrentPlan";
import LastPayment from "./_components/LastPayment";
import PlanComparison from "./_components/PlanComparison";
import BillingHistory from "./_components/BillingHistory";
import PaymentHistory from "./_components/PaymentHistory";
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

  const { subscription, plans, usage, payments, paidAhead, renewal, lastPayment } =
    await getBillingData(organization.id);

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

      <RenewalBanner
        subscription={subscription}
        renewal={renewal}
        paidAhead={paidAhead}
        isOwner={isOwner}
        organizationId={organization.id}
      />

      <CurrentPlan
        subscription={subscription}
        paidAhead={paidAhead}
        usage={usage}
        isOwner={isOwner}
        organizationId={organization.id}
      />

      {isOwner && <LastPayment payment={lastPayment} />}

      {isOwner && (
        <PlanComparison
          plans={plans}
          subscription={subscription}
          paidAhead={paidAhead}
          isOwner={isOwner}
          organizationId={organization.id}
        />
      )}

      {isOwner && <PaymentHistory payments={payments} />}

      {isOwner && <BillingHistory organizationId={organization.id} />}
    </div>
  );
}
