import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import {
  getTeamMembersService as getTeamMembers,
  getSubscriptionDetailsService as getSubscriptionDetails,
} from "@/lib/services/team";
import TeamHeader from "./_components/TeamHeader";
import TeamMembersTable from "./_components/TeamMembersTable";
import InviteMemberButton from "./_components/InviteMemberButton";

export default async function TeamPage({ params }) {
  const { slug } = await params;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  const members = await getTeamMembers(organization.id);

  const subscription = await getSubscriptionDetails(organization.id);

  const currentPlan = subscription?.plan?.type;
  const memberLimit = subscription?.plan?.maxMembers;
  const canAddMembers = memberLimit === -1 || members.length < memberLimit;

  return (
    <div className="p-3 sm:p-6">
      <TeamHeader memberCount={members.length} memberLimit={memberLimit} />

      <div className="space-y-6">
        {isOwner && (
          <div className="flex justify-end">
            <InviteMemberButton
              organizationId={organization.id}
              canAdd={canAddMembers}
              currentPlan={currentPlan}
            />
          </div>
        )}

        <TeamMembersTable
          members={members}
          currentUserId={user.id}
          isOwner={isOwner}
          organizationId={organization.id}
        />
      </div>
    </div>
  );
}
