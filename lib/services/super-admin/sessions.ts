import * as sessionsRepo from "@/lib/repositories/super-admin/sessions";
import type { Prisma } from "@/lib/generated/prisma";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { SESSIONS_PER_PAGE, SESSION_VIEWS, type SessionQuery, type SessionView } from "./sessions-options";

/**
 * The super-admin support sessions list (canvas: Super admin support
 * sessions round 1, "1 · Data table"): views with their counts — open now,
 * mine, this week — search, an admin filter and a period, and a page of
 * sessions, each with how many changes were made while it was open.
 */

function viewWhere(view: SessionView, adminId: string, now: Date): Prisma.ImpersonationSessionWhereInput {
  switch (view) {
    case "open":
      return { endedAt: null };
    case "mine":
      return { superAdminId: adminId };
    case "week":
      return { startedAt: { gte: cairoMidnight(addDays(cairoDate(now), -6)) } };
    default:
      return {};
  }
}

/** Search, admin and period: everything but the view. The view counts share it. */
function sessionFilters(query: SessionQuery, now: Date): Prisma.ImpersonationSessionWhereInput {
  const and: Prisma.ImpersonationSessionWhereInput[] = [];
  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" as const };
    and.push({
      OR: [
        { reason: contains },
        { organization: { name: contains } },
        { targetUser: { OR: [{ name: contains }, { email: contains }] } },
        { superAdmin: { OR: [{ name: contains }, { email: contains }] } },
      ],
    });
  }
  if (query.admin) and.push({ superAdminId: query.admin });
  if (query.days !== "all") and.push({ startedAt: { gte: cairoMidnight(addDays(cairoDate(now), -(Number(query.days) - 1))) } });
  return { AND: and };
}

export async function getSessions(query: SessionQuery, adminId: string, now: Date = new Date()) {
  const filters = sessionFilters(query, now);
  const where = { AND: [filters, viewWhere(query.view, adminId, now)] };

  const [total, counts, admins, dealerships] = await Promise.all([
    sessionsRepo.countSessions(where),
    Promise.all(SESSION_VIEWS.map((view) => sessionsRepo.countSessions({ AND: [filters, viewWhere(view, adminId, now)] }))),
    sessionsRepo.findSessionAdmins(),
    sessionsRepo.findActiveDealerships(),
  ]);
  const pages = Math.max(1, Math.ceil(total / SESSIONS_PER_PAGE));
  const page = Math.min(query.page, pages);
  const rows = await sessionsRepo.findSessions({ where, skip: (page - 1) * SESSIONS_PER_PAGE, take: SESSIONS_PER_PAGE });
  // What was changed while each session was open.
  const changes = await Promise.all(rows.map((s) => sessionsRepo.countChangesDuring(s.id)));

  return {
    query: { ...query, page },
    counts: Object.fromEntries(SESSION_VIEWS.map((view, i) => [view, counts[i]])) as Record<SessionView, number>,
    total,
    pages,
    admins,
    dealerships,
    now: now.toISOString(),
    rows: rows.map((s, i) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      changes: changes[i],
    })),
  };
}

export type SessionsPage = Awaited<ReturnType<typeof getSessions>>;
export type SessionRow = SessionsPage["rows"][number];
