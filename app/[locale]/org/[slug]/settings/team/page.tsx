import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import {
  getTeamMembersService as getTeamMembers,
  getSubscriptionDetailsService as getSubscriptionDetails,
} from "@/lib/services/team";
import TeamMembersTable from "./_components/TeamMembersTable";

/** Settings' Team tab: who works on the dealership, and, for owners, inviting and removing them. */
export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const [members, subscription] = await Promise.all([
    getTeamMembers(organization.id),
    getSubscriptionDetails(organization.id),
  ]);

  const memberLimit = subscription?.plan?.maxMembers;
  // No active plan means no seats, which is what the loose `<` comparison
  // against undefined already worked out to.
  const canAddMembers = memberLimit === -1 || (memberLimit !== undefined && members.length < memberLimit);

  return (
    <TeamMembersTable
      members={members}
      currentUserId={user!.id}
      isOwner={isOwner}
      organizationId={organization.id}
      memberLimit={memberLimit}
      canAddMembers={canAddMembers}
    />
  );
}
