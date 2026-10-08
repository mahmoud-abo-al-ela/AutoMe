import * as activityRepo from "@/lib/repositories/super-admin/platform-activity";
import type { EntityType, Prisma } from "@/lib/generated/prisma";
import { findLookups, toEntry } from "@/lib/services/audit/activity";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import {
  PLATFORM_ACTIVITY_EXPORT_LIMIT,
  PLATFORM_ACTIVITY_PER_PAGE,
  type PlatformActivityKind,
  type PlatformActivityQuery,
} from "./platform-activity-options";

/**
 * The super-admin Activity page (canvas: Super admin activity round 1, "2 ·
 * Data table"): every change across AutoMe, newest first, filtered by who
 * made it, what kind of thing it was, the dealership and the period — each
 * with who made it, where, and what it was before and after.
 */

const KIND_TYPES: Record<Exclude<PlatformActivityKind, "all">, EntityType[]> = {
  cars: ["CAR"],
  drives: ["TEST_DRIVE"],
  team: ["MEMBERSHIP"],
  plan: ["SUBSCRIPTION"],
  dealership: ["ORGANIZATION", "WORKING_HOURS"],
  accounts: ["USER"],
  sessions: ["IMPERSONATION_SESSION"],
};

export function activityWhere(query: PlatformActivityQuery, now: Date): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];
  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    and.push({
      OR: [
        { userEmail: contains },
        { user: { is: { OR: [{ name: contains }, { email: contains }] } } },
        { organization: { is: { name: contains } } },
        { entityId: query.search },
      ],
    });
  }
  if (query.who === "staff") and.push({ user: { is: { role: "ADMIN" } } });
  if (query.who === "support") and.push({ impersonatedBy: { not: null } });
  if (query.who === "others") and.push({ OR: [{ userId: null }, { user: { is: { role: "USER" } } }] });
  if (query.kind !== "all") and.push({ entityType: { in: KIND_TYPES[query.kind] } });
  if (query.dealership) and.push({ organizationId: query.dealership });
  if (query.days !== "all") and.push({ createdAt: { gte: cairoMidnight(addDays(cairoDate(now), -(Number(query.days) - 1))) } });
  return { AND: and };
}

type Row = Awaited<ReturnType<typeof activityRepo.findEntries>>[number];

const read = (value: unknown, key: string) =>
  value && typeof value === "object" && key in value ? (value as Record<string, unknown>)[key] : undefined;
const text = (value: unknown) => (typeof value === "string" && value && value !== "unknown" ? value : null);

/** Who made a change, as the table's last column names it. */
export function sourceOf(row: Pick<Row, "impersonatedBy" | "organizationId" | "user" | "userEmail">) {
  if (row.impersonatedBy) return "support" as const;
  // Deleting an account unlinks its entries but keeps the email on them.
  if (!row.user) return row.userEmail ? ("removed" as const) : ("system" as const);
  if (row.user.role === "ADMIN") return "staff" as const;
  return row.user.memberships.some((m) => m.organizationId === row.organizationId) ? ("dealer" as const) : ("buyer" as const);
}

async function serialize(rows: Row[]) {
  const lookups = await findLookups(rows);
  return {
    lookups,
    entries: rows.map((row) => ({
      ...toEntry(row),
      dealership: row.organization,
      actorId: row.user?.id ?? null,
      source: sourceOf(row),
      // During a support session, the member the admin was signed in as.
      signedInAs: row.impersonatedBy,
      // A deleted dealership is unlinked from its entries; its delete entry keeps the name.
      deletedDealership: text(read(row.metadata, "deletedOrg")),
      ip: text(read(row.metadata, "ipAddress")),
      userAgent: text(read(row.metadata, "userAgent")),
    })),
  };
}

export async function getPlatformActivity(query: PlatformActivityQuery, now: Date = new Date()) {
  const where = activityWhere(query, now);
  const [total, dealerships] = await Promise.all([activityRepo.countEntries(where), activityRepo.findDealershipNames()]);
  const pages = Math.max(1, Math.ceil(total / PLATFORM_ACTIVITY_PER_PAGE));
  const page = Math.min(query.page, pages);
  const rows = await activityRepo.findEntries({ where, skip: (page - 1) * PLATFORM_ACTIVITY_PER_PAGE, take: PLATFORM_ACTIVITY_PER_PAGE });
  return { query: { ...query, page }, total, pages, dealerships, ...(await serialize(rows)) };
}

/** Everything the filters match, up to the export limit, for the CSV. */
export async function getPlatformActivityForExport(query: PlatformActivityQuery, now: Date = new Date()) {
  const rows = await activityRepo.findEntries({ where: activityWhere(query, now), take: PLATFORM_ACTIVITY_EXPORT_LIMIT });
  return serialize(rows);
}

export type PlatformActivity = Awaited<ReturnType<typeof getPlatformActivity>>;
export type PlatformActivityEntry = PlatformActivity["entries"][number];
export type PlatformActivitySource = PlatformActivityEntry["source"];
