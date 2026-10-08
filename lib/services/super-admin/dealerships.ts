import * as dealershipsRepo from "@/lib/repositories/super-admin/dealerships";
import type { Prisma } from "@/lib/generated/prisma";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import {
  DEALERSHIPS_PER_PAGE,
  DEALERSHIP_VIEWS,
  RECENT_DRIVE_DAYS,
  type DealershipQuery,
  type DealershipSort,
  type DealershipView,
} from "./dealerships-options";

/**
 * The super-admin dealerships list (canvas: Super admin dealerships round 1,
 * "1 · Data table"): saved views with their counts, search, plan and
 * governorate filters, a sort, and a page of rows with each dealership's
 * plan, standing, size, recent test drives and what it has paid.
 */

const VIEW_WHERE: Record<DealershipView, Prisma.OrganizationWhereInput> = {
  all: {},
  active: { isActive: true },
  trial: { subscription: { status: "TRIALING" } },
  overdue: { subscription: { status: "PAST_DUE" } },
  noCars: { cars: { none: {} } },
  suspended: { isActive: false },
};

const ORDER_BY: Record<DealershipSort, Prisma.OrganizationOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  name: [{ name: "asc" }],
  cars: [{ cars: { _count: "desc" } }, { createdAt: "desc" }],
};

/** Everything but the view: search, plan and governorate. The view counts share it. */
export function dealershipFilters(query: Pick<DealershipQuery, "search" | "plan" | "region">): Prisma.OrganizationWhereInput {
  const and: Prisma.OrganizationWhereInput[] = [{ deletedAt: null }];
  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    and.push({ OR: [{ name: contains }, { slug: contains }, { email: contains }, { phone: contains }] });
  }
  if (query.plan === "STARTER") {
    // A dealership without a subscription is on the free plan.
    and.push({ OR: [{ subscription: null }, { subscription: { plan: { type: "STARTER" } } }] });
  } else if (query.plan) {
    and.push({ subscription: { plan: { type: query.plan } } });
  }
  if (query.region) and.push({ region: query.region });
  return { AND: and };
}

export function dealershipWhere(query: Pick<DealershipQuery, "view" | "search" | "plan" | "region">): Prisma.OrganizationWhereInput {
  return { AND: [dealershipFilters(query), VIEW_WHERE[query.view]] };
}

type Row = dealershipsRepo.DealershipListRow;

/** Rows with what the table shows beside the dealership itself, dates as ISO strings. */
async function withTallies(rows: Row[], now: Date) {
  const ids = rows.map((row) => row.id);
  const since = cairoMidnight(addDays(cairoDate(now), -(RECENT_DRIVE_DAYS - 1)));
  const [drives, paid] = await Promise.all([
    dealershipsRepo.countRecentTestDrives(ids, since),
    dealershipsRepo.sumPaidPayments(ids),
  ]);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    email: row.email,
    phone: row.phone,
    city: row.city,
    region: row.region,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    plan: row.subscription?.plan ?? null,
    subscription: row.subscription
      ? {
          status: row.subscription.status,
          periodEnd: row.subscription.currentPeriodEnd?.toISOString() ?? null,
          pastDueSince: row.subscription.pastDueSince?.toISOString() ?? null,
        }
      : null,
    cars: row._count.cars,
    team: row._count.memberships,
    recentDrives: drives.get(row.id) ?? 0,
    paidCents: paid.get(row.id) ?? 0,
  }));
}

export async function getDealerships(query: DealershipQuery, now: Date = new Date()) {
  const filters = dealershipFilters(query);
  const where = dealershipWhere(query);

  const [total, counts] = await Promise.all([
    dealershipsRepo.countDealerships(where),
    Promise.all(DEALERSHIP_VIEWS.map((view) => dealershipsRepo.countDealerships({ AND: [filters, VIEW_WHERE[view]] }))),
  ]);
  const pages = Math.max(1, Math.ceil(total / DEALERSHIPS_PER_PAGE));
  const page = Math.min(query.page, pages);
  const rows = await dealershipsRepo.findDealerships({
    where,
    orderBy: ORDER_BY[query.sort],
    skip: (page - 1) * DEALERSHIPS_PER_PAGE,
    take: DEALERSHIPS_PER_PAGE,
  });

  return {
    query: { ...query, page },
    counts: Object.fromEntries(DEALERSHIP_VIEWS.map((view, i) => [view, counts[i]])) as Record<DealershipView, number>,
    total,
    pages,
    rows: await withTallies(rows, now),
  };
}

/** Every dealership the query matches, for the CSV — capped, so one click can't pull the whole table into memory. */
export const EXPORT_LIMIT = 5000;

export async function getDealershipsForExport(query: DealershipQuery, now: Date = new Date()) {
  const rows = await dealershipsRepo.findDealerships({
    where: dealershipWhere(query),
    orderBy: ORDER_BY[query.sort],
    take: EXPORT_LIMIT,
  });
  return withTallies(rows, now);
}

export type DealershipsPage = Awaited<ReturnType<typeof getDealerships>>;
export type DealershipRow = DealershipsPage["rows"][number];
