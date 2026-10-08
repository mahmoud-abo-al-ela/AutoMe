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

  const [lookups, people] = await Promise.all([
    findLookups(logs, organizationId),
    db.membership.findMany({
      where: { organizationId },
      select: { role: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    entries: logs.map(toEntry),
    lookups,
    people: people.map((m) => ({ id: m.user.id, name: m.user.name || m.user.email || "", role: m.role })),
    pagination,
  };
}

export type LogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  userEmail: string | null;
  impersonatedBy: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  user: { name: string | null; email: string | null } | null;
};

export function toEntry(log: LogRow) {
  return {
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
  };
}

/**
 * The names a page of entries refers to by id. Scoped to one dealership on
 * its own Activity page; across all of them for the super-admin's view of a
 * person, which only platform admins reach.
 */
export async function findLookups(logs: LogRow[], organizationId?: string) {
  const values = logs.flatMap((log) => [log.oldValue, log.newValue]);
  const carIds = ids(
    logs.flatMap((log) => [
      field(log.newValue, "carId"),
      log.entityType === "CAR" ? log.entityId : undefined,
    ]),
  );
  const userIds = ids([
    ...values.flatMap((value) => [field(value, "userId"), field(value, "targetUserId")]),
    ...logs.map((log) => (log.entityType === "USER" ? log.entityId : undefined)),
    // During a support session: the member the admin was signed in as.
    ...logs.map((log) => log.impersonatedBy),
  ]);
  const membershipIds = ids(
    logs.filter((log) => log.entityType === "MEMBERSHIP").map((log) => log.entityId),
  );
  const planIds = ids(values.map((value) => field(value, "planId")));

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

  return {
    cars: Object.fromEntries(cars.map((car) => [car.id, { make: car.make, model: car.model, year: car.year }])),
    users: Object.fromEntries(users.map((user) => [user.id, user.name || user.email || null])),
    memberships: Object.fromEntries(memberships.map((m) => [m.id, m.user?.name || m.user?.email || null])),
    plans: Object.fromEntries(plans.map((plan) => [plan.id, { type: plan.type, name: plan.name }])),
  };
}

/**
 * One person's activity across every dealership, newest first — for the
 * super-admin's page about them. Each entry carries the dealership it
 * happened at, since there may be several.
 */
export async function getUserActivity({ userId, page, take = ACTIVITY_PAGE_SIZE }: { userId: string; page: number; take?: number }) {
  const where = { userId };
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: { user: { select: { name: true, email: true } }, organization: { select: { id: true, name: true } } },
    }),
    db.auditLog.count({ where }),
  ]);
  const lookups = await findLookups(logs);
  return {
    entries: logs.map((log) => ({ ...toEntry(log), dealership: log.organization })),
    lookups,
    people: [] as { id: string; name: string; role: string }[],
    pagination: { total, page, limit: take, totalPages: Math.max(1, Math.ceil(total / take)) },
  };
}

export type Activity = Awaited<ReturnType<typeof getActivity>>;
export type ActivityEntry = Activity["entries"][number];
export type ActivityLookups = Activity["lookups"];
