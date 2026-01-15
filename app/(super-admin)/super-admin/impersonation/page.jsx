import { db } from "@/lib/prisma";
import ImpersonationHeader from "./_components/ImpersonationHeader";
import ActiveSessions from "./_components/ActiveSessions";
import SessionHistory from "./_components/SessionHistory";
import QuickImpersonate from "./_components/QuickImpersonate";

async function getImpersonationData() {
  const [activeSessions, recentSessions, organizations] = await Promise.all([
    // Active impersonation sessions
    db.impersonationSession.findMany({
      where: { endedAt: null },
      include: {
        superAdmin: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { startedAt: "desc" },
    }),
    // Recent sessions history
    db.impersonationSession.findMany({
      where: { endedAt: { not: null } },
      take: 20,
      include: {
        superAdmin: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { endedAt: "desc" },
    }),
    // Organizations for quick impersonate
    db.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        memberships: {
          where: { role: "OWNER" },
          take: 1,
          include: {
            user: {
              select: { id: true, name: true, email: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    activeSessions,
    recentSessions,
    organizations: organizations.map((org) => ({
      ...org,
      owner: org.memberships[0]?.user || null,
    })),
  };
}

export default async function ImpersonationPage() {
  const { activeSessions, recentSessions, organizations } =
    await getImpersonationData();

  return (
    <div className="space-y-6">
      <ImpersonationHeader activeCount={activeSessions.length} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ActiveSessions sessions={activeSessions} />
          <SessionHistory sessions={recentSessions} />
        </div>
        <div>
          <QuickImpersonate organizations={organizations} />
        </div>
      </div>
    </div>
  );
}
