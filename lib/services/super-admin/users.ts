import * as usersRepo from "@/lib/repositories/super-admin/users-list";
import type { Prisma } from "@/lib/generated/prisma";
import { cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { USERS_PER_PAGE, USER_VIEWS, type UserQuery, type UserSort, type UserView } from "./users-options";

/**
 * The super-admin users list (canvas: Super admin users round 1, "1 · Data
 * table"): views by kind of account with their counts, search, a dealership
 * filter and a sort, and a page of people with what kind of account each is,
 * their dealership, and what they have done as a buyer.
 */

const ORDER_BY: Record<UserSort, Prisma.UserOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  name: [{ name: "asc" }, { email: "asc" }],
  active: [{ testDrives: { _count: "desc" } }, { savedCars: { _count: "desc" } }, { createdAt: "desc" }],
};

function viewWhere(view: UserView, now: Date): Prisma.UserWhereInput {
  switch (view) {
    case "buyers":
      // A buyer: an ordinary account that belongs to no dealership.
      return { role: "USER", memberships: { none: {} } };
    case "teams":
      return { memberships: { some: {} } };
    case "admins":
      return { role: "ADMIN" };
    case "new":
      return { createdAt: { gte: cairoMidnight(`${cairoDate(now).slice(0, 7)}-01`) } };
    default:
      return {};
  }
}

/** Search and dealership: everything but the view. The view counts share it. */
export function userFilters(query: Pick<UserQuery, "search" | "dealership">): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    and.push({ OR: [{ name: contains }, { email: contains }, { phone: contains }] });
  }
  if (query.dealership) and.push({ memberships: { some: { organizationId: query.dealership } } });
  return { AND: and };
}

function serialize(row: usersRepo.UserListRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    imageUrl: row.imageUrl,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    memberships: row.memberships.map((m) => ({ role: m.role, organization: m.organization })),
    savedCars: row._count.savedCars,
    testDrives: row._count.testDrives,
  };
}

export async function getUsers(query: UserQuery, now: Date = new Date()) {
  const filters = userFilters(query);
  const where: Prisma.UserWhereInput = { AND: [filters, viewWhere(query.view, now)] };

  const [total, counts, dealerships] = await Promise.all([
    usersRepo.countUsers(where),
    Promise.all(USER_VIEWS.map((view) => usersRepo.countUsers({ AND: [filters, viewWhere(view, now)] }))),
    usersRepo.findDealershipNames(),
  ]);
  const pages = Math.max(1, Math.ceil(total / USERS_PER_PAGE));
  const page = Math.min(query.page, pages);
  const rows = await usersRepo.findUsers({ where, orderBy: ORDER_BY[query.sort], skip: (page - 1) * USERS_PER_PAGE, take: USERS_PER_PAGE });

  return {
    query: { ...query, page },
    counts: Object.fromEntries(USER_VIEWS.map((view, i) => [view, counts[i]])) as Record<UserView, number>,
    total,
    pages,
    dealerships,
    rows: rows.map(serialize),
  };
}

/** Everyone the query matches, for the CSV — capped, so one click can't pull the whole table into memory. */
export const USERS_EXPORT_LIMIT = 5000;

export async function getUsersForExport(query: UserQuery, now: Date = new Date()) {
  const rows = await usersRepo.findUsers({
    where: { AND: [userFilters(query), viewWhere(query.view, now)] },
    orderBy: ORDER_BY[query.sort],
    take: USERS_EXPORT_LIMIT,
  });
  return rows.map(serialize);
}

export type UsersPage = Awaited<ReturnType<typeof getUsers>>;
export type UserRow = UsersPage["rows"][number];
