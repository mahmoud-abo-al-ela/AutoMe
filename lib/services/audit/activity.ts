import { db } from "@/lib/prisma";
import type { EntityType } from "@/lib/generated/prisma";
import { getAuditLogs } from "./query";
import type { ActivityKind } from "./activity-filters";

export { ACTIVITY_DAYS, ACTIVITY_KINDS, type ActivityKind } from "./activity-filters";

/**
 * The dealer's Activity page: one page of audit entries, plus the names the
 * entries refer to by id — the cars a test drive was for, the people a team
 * change was about, the plans a plan change moved between — so each entry can
 * be written as a sentence. Every lookup is scoped to the organization.
 */


const KIND_TYPES: Record<Exclude<ActivityKind, "all">, EntityType[]> = {
  cars: ["CAR"],
  drives: ["TEST_DRIVE"],
  team: ["MEMBERSHIP", "USER"],
  plan: ["SUBSCRIPTION"],
  settings: ["ORGANIZATION", "WORKING_HOURS"],
};

export const ACTIVITY_PAGE_SIZE = 30;

const field = (value: unknown, key: string) =>
  value && typeof value === "object" && key in value ? (value as Record<string, unknown>)[key] : undefined;
const ids = (values: unknown[]) => [...new Set(values.filter((v): v is string => typeof v === "string" && v.length > 0))];

export async function getActivity({
  organizationId,
  kind,
  userId,
  days,
  page,
}: {
  organizationId: string;
  kind: ActivityKind;
  userId?: string;
  days?: number;
  page: number;
}) {
  const { logs, pagination } = await getAuditLogs({
    organizationId,
    filters: {
      ...(kind !== "all" && { entityTypes: KIND_TYPES[kind] }),
      ...(userId && { userId }),
      ...(days && { since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() }),
    },
    pagination: { page, limit: ACTIVITY_PAGE_SIZE },
  });

  const values = logs.flatMap((log) => [log.oldValue, log.newValue]);
  const carIds = ids(
    logs.flatMap((log) => [
      field(log.newValue, "carId"),
      log.entityType === "CAR" ? log.entityId : undefined,
    ]),
  );
  const userIds = ids(values.flatMap((value) => [field(value, "userId"), field(value, "targetUserId")]));
  const membershipIds = ids(
    logs.filter((log) => log.entityType === "MEMBERSHIP").map((log) => log.entityId),
  );
  const planIds = ids(values.map((value) => field(value, "planId")));

  const [cars, users, memberships, plans, people] = await Promise.all([
    carIds.length
      ? db.car.findMany({ where: { id: { in: carIds }, organizationId }, select: { id: true, make: true, model: true, year: true } })
      : [],
    userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [],
    membershipIds.length
      ? db.membership.findMany({
          where: { id: { in: membershipIds }, organizationId },
          select: { id: true, user: { select: { name: true, email: true } } },
        })
      : [],
    planIds.length ? db.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, type: true, name: true } }) : [],
    db.membership.findMany({
      where: { organizationId },
      select: { role: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    entries: logs.map(
      (log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        createdAt: log.createdAt.toISOString(),
        who: log.user?.name || log.user?.email || log.userEmail || null,
        // Done during a support session: the actor is AutoMe staff, signed in as a member.
        bySupport: !!log.impersonatedBy,
        oldValue: log.oldValue,
        newValue: log.newValue,
        car: (field(log.metadata, "car") as { make: string | null; model: string | null; year: number | null } | undefined) ?? null,
      }),
    ),
    lookups: {
      cars: Object.fromEntries(cars.map((car) => [car.id, { make: car.make, model: car.model, year: car.year }])),
      users: Object.fromEntries(users.map((user) => [user.id, user.name || user.email || null])),
      memberships: Object.fromEntries(memberships.map((m) => [m.id, m.user?.name || m.user?.email || null])),
      plans: Object.fromEntries(plans.map((plan) => [plan.id, { type: plan.type, name: plan.name }])),
    },
    people: people.map((m) => ({ id: m.user.id, name: m.user.name || m.user.email || "", role: m.role })),
    pagination,
  };
}

export type Activity = Awaited<ReturnType<typeof getActivity>>;
export type ActivityEntry = Activity["entries"][number];
export type ActivityLookups = Activity["lookups"];
