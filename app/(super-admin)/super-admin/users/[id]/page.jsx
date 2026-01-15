import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import UserDetailsHeader from "./_components/UserDetailsHeader";
import UserActivity from "./_components/UserActivity";
import UserOrganizations from "./_components/UserOrganizations";

async function getUser(userId) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscription: { include: { plan: true } },
            },
          },
        },
      },
      testDrives: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          car: { select: { id: true, make: true, model: true, year: true } },
        },
      },
      savedCars: {
        take: 10,
        include: {
          car: { select: { id: true, make: true, model: true, year: true, images: true } },
        },
      },
    },
  });

  if (!user) return null;

  // Get recent audit logs for this user
  const recentActivity = await db.auditLog.findMany({
    where: { userId: user.id },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return { user, recentActivity };
}

export default async function UserDetailsPage({ params }) {
  const { id } = await params;
  const data = await getUser(id);

  if (!data) {
    notFound();
  }

  const { user, recentActivity } = data;

  return (
    <div className="space-y-6">
      <UserDetailsHeader user={user} />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UserActivity activity={recentActivity} testDrives={user.testDrives} />
        </div>
        <div>
          <UserOrganizations memberships={user.memberships} />
        </div>
      </div>
    </div>
  );
}
