import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrgMessagesPageClient } from "./_components/OrgMessagesPageClient";
import { getOrgConversations } from "@/actions/messages";
import { getOrganization } from "@/lib/getOrganization";
import { db as prisma } from "@/lib/prisma";

export const metadata = {
  title: "Messages",
  description: "Manage customer conversations",
};

export default async function OrgMessagesPage({ params }) {
  const { slug } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const { organization, membership } = await getOrganization(slug);

  if (!organization || !membership) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  // Get all org members
  const orgMemberships = await prisma.membership.findMany({
    where: { organizationId: organization.id },
    select: { userId: true },
  });
  const orgMembers = orgMemberships.map(m => m.userId);

  const result = await getOrgConversations(slug);
  const conversations = result.success ? result.data : [];

  return (
    <OrgMessagesPageClient
      initialConversations={conversations}
      currentUserId={user.id}
      orgMembers={orgMembers}
      slug={slug}
    />
  );
}
