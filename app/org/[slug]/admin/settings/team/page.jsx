import { checkUser } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import TeamHeader from "./_components/TeamHeader";
import TeamMembersTable from "./_components/TeamMembersTable";
import InviteMemberButton from "./_components/InviteMemberButton";

async function getTeamMembers(organizationId) {
  const members = await db.membership.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members;
}

export default async function TeamPage() {
  const user = await checkUser();
  const organization = await getCurrentOrganization();

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  const members = await getTeamMembers(organization.id);

  // Get plan limits
  const planFeatures = {
    STARTER: { maxMembers: 3 },
    PRO: { maxMembers: 10 },
    ENTERPRISE: { maxMembers: -1 }, // unlimited
  };

  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: organization.id,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: true,
    },
  });

  const currentPlan = subscription?.plan?.type || "STARTER";
  const memberLimit = planFeatures[currentPlan].maxMembers;
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
