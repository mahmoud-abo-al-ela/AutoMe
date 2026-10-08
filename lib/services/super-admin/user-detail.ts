import * as userRepo from "@/lib/repositories/super-admin/user-detail";
import { getUserActivity } from "@/lib/services/audit/activity";
import { addDays, cairoDate, cairoMidnight, dateOnlyToUtc } from "@/lib/utils/date-only";
import { USER_DETAIL_PER_PAGE, type UserTab } from "./users-options";

/**
 * One person for the super-admin (canvas: Super admin one user round 1, "A ·
 * Record with tabs"): who they are and what kind of account they have, then
 * tabs that follow that kind — a buyer's test drives, saved cars and reviews;
 * a team member's dealerships and activity; AutoMe staff's support sessions.
 */

export type UserKind = "admin" | "staff" | "buyer";

const RECENT_DAYS = 30;
const SUMMARY_ROWS = 5;
const SUMMARY_ACTIVITY = 6;

const pageOf = (page: number, total: number) => {
  const pages = Math.max(1, Math.ceil(total / USER_DETAIL_PER_PAGE));
  const current = Math.min(Math.max(1, page), pages);
  return { page: current, pages, skip: (current - 1) * USER_DETAIL_PER_PAGE };
};

/** The tabs a person's page has: only those with something to show for this kind of account. */
export function userTabs(user: { role: string; memberships: unknown[]; savedCars: number; testDrives: number; reviews: number }): UserTab[] {
  const tabs: UserTab[] = ["summary"];
  const staff = user.memberships.length > 0;
  const admin = user.role === "ADMIN";
  if (staff) tabs.push("dealerships");
  // A buyer's tabs for buyers, and for anyone else who has also browsed as one.
  if ((!staff && !admin) || user.savedCars + user.testDrives + user.reviews > 0) tabs.push("drives", "saved", "reviews");
  if (admin) tabs.push("sessions");
  if (staff || admin) tabs.push("activity");
  return tabs;
}

type DriveRow = Awaited<ReturnType<typeof userRepo.findTestDrives>>[number];
const serializeDrive = (d: DriveRow) => ({ ...d, date: d.date.toISOString().slice(0, 10) });
type SavedRow = Awaited<ReturnType<typeof userRepo.findSavedCars>>[number];
const serializeSaved = (s: SavedRow) => ({
  id: s.id,
  savedAt: s.createdAt.toISOString(),
  car: { ...s.car, price: Number(s.car.price), image: s.car.images[0] ?? null, images: undefined },
});
type SessionRow = Awaited<ReturnType<typeof userRepo.findSupportSessions>>[number];
const serializeSession = (s: SessionRow) => ({ ...s, startedAt: s.startedAt.toISOString(), endedAt: s.endedAt?.toISOString() ?? null });

export async function getUserDetail(id: string, query: { tab: UserTab; page: number }, now: Date = new Date()) {
  const user = await userRepo.findUser(id);
  if (!user) return null;

  const today = cairoDate(now);
  const since = cairoMidnight(addDays(today, -(RECENT_DAYS - 1)));
  const kind: UserKind = user.role === "ADMIN" ? "admin" : user.memberships.length > 0 ? "staff" : "buyer";
  const counts = {
    savedCars: user._count.savedCars,
    testDrives: user._count.testDrives,
    reviews: user._count.dealershipReviews,
    sessions: user._count.superAdminSessions,
    dealerships: user.memberships.length,
  };
  const tabs = userTabs({ role: user.role, memberships: user.memberships, savedCars: counts.savedCars, testDrives: counts.testDrives, reviews: counts.reviews });
  const tab = tabs.includes(query.tab) ? query.tab : "summary";

  // The four numbers at the top, for the kind of account.
  const [upcoming, savedDealerships, rating, carsAdded, recentChanges, openSessions] = await Promise.all([
    kind === "buyer" ? userRepo.countUpcomingDrives(id, dateOnlyToUtc(today)) : 0,
    kind === "buyer" ? userRepo.countSavedDealerships(id) : 0,
    kind === "buyer" ? userRepo.averageRating(id) : null,
    kind === "staff" ? userRepo.countAudit({ userId: id, action: "CAR_CREATED" }) : 0,
    kind !== "buyer" ? userRepo.countAudit({ userId: id, createdAt: { gte: since } }) : 0,
    kind === "admin" ? userRepo.countOpenSessions(id) : 0,
  ]);

  const base = {
    tab,
    tabs,
    kind,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      memberships: user.memberships.map((m) => ({ id: m.id, role: m.role, joinedAt: m.createdAt.toISOString(), organization: m.organization })),
    },
    counts,
    stats: { upcoming, savedDealerships, rating, carsAdded, recentChanges, openSessions },
  };

  if (tab === "summary") {
    const [drives, saved, sessions, activity] = await Promise.all([
      kind === "buyer" ? userRepo.findTestDrives(id, 0, SUMMARY_ROWS) : [],
      kind === "buyer" ? userRepo.findSavedCars(id, 0, SUMMARY_ROWS) : [],
      kind === "admin" ? userRepo.findSupportSessions(id, 0, SUMMARY_ROWS) : [],
      kind !== "buyer" ? getUserActivity({ userId: id, page: 1, take: SUMMARY_ACTIVITY }) : null,
    ]);
    const dealerships = kind === "staff" ? await dealershipTallies(id, base.user.memberships, since) : [];
    return {
      ...base,
      summary: { drives: drives.map(serializeDrive), saved: saved.map(serializeSaved), sessions: sessions.map(serializeSession), activity, dealerships },
    };
  }
  if (tab === "dealerships") {
    return { ...base, dealerships: await dealershipTallies(id, base.user.memberships, since) };
  }
  if (tab === "drives") {
    const { page, pages, skip } = pageOf(query.page, counts.testDrives);
    const rows = await userRepo.findTestDrives(id, skip, USER_DETAIL_PER_PAGE);
    return { ...base, drives: { rows: rows.map(serializeDrive), page, pages, total: counts.testDrives } };
  }
  if (tab === "saved") {
    const { page, pages, skip } = pageOf(query.page, counts.savedCars);
    const rows = await userRepo.findSavedCars(id, skip, USER_DETAIL_PER_PAGE);
    return { ...base, saved: { rows: rows.map(serializeSaved), page, pages, total: counts.savedCars } };
  }
  if (tab === "reviews") {
    const rows = await userRepo.findReviews(id);
    return { ...base, reviews: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) };
  }
  if (tab === "sessions") {
    const { page, pages, skip } = pageOf(query.page, counts.sessions);
    const rows = await userRepo.findSupportSessions(id, skip, USER_DETAIL_PER_PAGE);
    return { ...base, sessions: { rows: rows.map(serializeSession), page, pages, total: counts.sessions } };
  }
  return { ...base, activity: await getUserActivity({ userId: id, page: query.page, take: USER_DETAIL_PER_PAGE }) };
}

/** Each of their dealerships with what they did there: cars added, and changes in the last 30 days. */
async function dealershipTallies(userId: string, memberships: { id: string; role: string; joinedAt: string; organization: { id: string; name: string; slug: string; isActive: boolean; subscription: { status: string } | null } }[], since: Date) {
  const [added, recent] = await Promise.all([
    userRepo.countAuditByDealership(userId, { action: "CAR_CREATED" }),
    userRepo.countAuditByDealership(userId, { createdAt: { gte: since } }),
  ]);
  return memberships.map((m) => ({ ...m, carsAdded: added.get(m.organization.id) ?? 0, recentChanges: recent.get(m.organization.id) ?? 0 }));
}

export type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>;
