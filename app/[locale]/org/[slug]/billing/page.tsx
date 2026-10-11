import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { getBillingContact, getBillingData } from "@/lib/services/billing";
import { BillingView } from "./_components/BillingView";

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
    ? await getBillingContact(organization.id)
    : null;

  return (
    <BillingView
      plans={plans}
      subscription={subscription}
      paidAhead={paidAhead}
      renewal={renewal}
      usage={usage}
      payments={payments}
      lastPayment={lastPayment}
      isOwner={isOwner}
      owner={owner}
      organizationId={organization.id}
    />
  );
}
