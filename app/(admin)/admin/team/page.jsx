import { checkUser } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamHeader from "./_components/TeamHeader";
import TeamTable from "./_components/TeamTable";
import InviteMemberButton from "./_components/InviteMemberButton";

async function getTeamMembers(organizationId) {
  const members = await prisma.membership.findMany({
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
  const isOwnerOrAdmin =
    membership?.role === "OWNER" || membership?.role === "ADMIN";

  const members = await getTeamMembers(organization.id);

  // Get plan limits
  const planFeatures = {
    STARTER: { maxMembers: 3 },
    PRO: { maxMembers: 10 },
    ENTERPRISE: { maxMembers: -1 }, // unlimited
  };

  const subscription = await prisma.subscription.findFirst({
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
    <div className="space-y-6">
      <TeamHeader memberCount={members.length} memberLimit={memberLimit} />

      {isOwnerOrAdmin && (
        <div className="flex justify-end">
          <InviteMemberButton
            organizationId={organization.id}
            canAdd={canAddMembers}
            currentPlan={currentPlan}
          />
        </div>
      )}

      <TeamTable
        members={members}
        currentUserId={user.id}
        isOwnerOrAdmin={isOwnerOrAdmin}
        organizationId={organization.id}
      />
    </div>
  );
}
