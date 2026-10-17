import { db } from "@/lib/prisma";

/** A dealership's members, oldest first, for the Activity page's "who" filter. */
export async function findMembershipPeople(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId },
    select: { role: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function findActivityLookupRows({
  carIds,
  userIds,
  membershipIds,
  planIds,
  organizationId,
}: {
  carIds: string[];
  userIds: string[];
  membershipIds: string[];
  planIds: string[];
  organizationId?: string;
}) {
  const [cars, users, memberships, plans] = await Promise.all([
    carIds.length
      ? db.car.findMany({ where: { id: { in: carIds }, ...(organizationId && { organizationId }) }, select: { id: true, make: true, model: true, year: true } })
      : [],
    userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [],
    membershipIds.length
      ? db.membership.findMany({
          where: { id: { in: membershipIds }, ...(organizationId && { organizationId }) },
          select: { id: true, user: { select: { name: true, email: true } } },
        })
      : [],
    planIds.length ? db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, type: true, name: true } }) : [],
  ]);
  return { cars, users, memberships, plans };
}

/** One page of a person's entries across every dealership, newest first, with the total. */
export async function findUserAuditLogs({ userId, skip, take }: { userId: string; skip: number; take: number }) {
  const where = { userId };
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { user: { select: { name: true, email: true } }, organization: { select: { id: true, name: true } } },
    }),
    db.auditLog.count({ where }),
  ]);
  return { logs, total };
}
