import { db } from "@/lib/prisma";
import type { AssistantOutcome, Prisma, TestDriveStatus } from "@/lib/generated/prisma";

/**
 * Data access for the super-admin Analytics page. Every count takes a window
 * [from, to); the service asks for the period and the one before it.
 */

export type Window = { from: Date; to: Date };
const inWindow = ({ from, to }: Window) => ({ gte: from, lt: to });

// ---------- Cars and demand ----------

export const countLiveCars = (where: Prisma.CarWhereInput = {}) => db.car.count({ where: { status: "AVAILABLE", ...where } });
export const countCarsListed = (w: Window) => db.car.count({ where: { createdAt: inWindow(w) } });
export const countSaves = (w: Window) => db.savedCar.count({ where: { createdAt: inWindow(w) } });

/** Test drives asked for in the window, optionally only those now in one of these states. */
export const countTestDrives = (w: Window, statuses?: TestDriveStatus[]) =>
  db.testDrive.count({ where: { createdAt: inWindow(w), ...(statuses && { status: { in: statuses } }) } });

/** A sale is a car's status moving to SOLD, as recorded in the audit log — the car keeps no sold date. */
const soldWhere = (w: Window): Prisma.AuditLogWhereInput => ({
  entityType: "CAR",
  createdAt: inWindow(w),
  newValue: { path: ["status"], equals: "SOLD" },
});
export const countSales = (w: Window) => db.auditLog.count({ where: soldWhere(w) });

/** Each sale in the window with when its car was listed, for the time it took to sell. */
export async function findSales(w: Window) {
  const sales = await db.auditLog.findMany({ where: soldWhere(w), select: { entityId: true, createdAt: true } });
  const ids = [...new Set(sales.map((s) => s.entityId).filter((id): id is string => !!id))];
  const cars = ids.length ? await db.car.findMany({ where: { id: { in: ids } }, select: { id: true, createdAt: true } }) : [];
  const listed = new Map(cars.map((car) => [car.id, car.createdAt]));
  return sales.flatMap((s) => {
    const at = s.entityId ? listed.get(s.entityId) : undefined;
    return at ? [{ listedAt: at, soldAt: s.createdAt }] : [];
  });
}

/** Sales per dealership in the window. */
export async function countSalesByDealership(w: Window, organizationIds: string[]) {
  if (organizationIds.length === 0) return new Map<string, number>();
  const rows = await db.auditLog.groupBy({
    by: ["organizationId"],
    where: { ...soldWhere(w), organizationId: { in: organizationIds } },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.organizationId ?? "", row._count._all]));
}

export const countLiveCarsPriced = (min: number, max: number | null) =>
  db.car.count({ where: { status: "AVAILABLE", price: { gte: min, ...(max !== null && { lt: max }) } } });

/** Live cars listed before a date that no buyer has saved. */
export const countUnsavedCars = (listedBefore: Date) =>
  db.car.count({ where: { status: "AVAILABLE", createdAt: { lt: listedBefore }, savedBy: { none: {} } } });

/** Test drives in the window, counted by a field of their car (make or body type). */
export async function countTestDrivesByCar(w: Window, field: "make" | "bodyType") {
  const perCar = await db.testDrive.groupBy({ by: ["carId"], where: { createdAt: inWindow(w) }, _count: { _all: true } });
  if (perCar.length === 0) return [];
  const cars = await db.car.findMany({ where: { id: { in: perCar.map((r) => r.carId) } }, select: { id: true, make: true, bodyType: true } });
  const value = new Map(cars.map((car) => [car.id, car[field]]));
  const totals = new Map<string, number>();
  for (const row of perCar) {
    const key = value.get(row.carId);
    if (key) totals.set(key, (totals.get(key) ?? 0) + row._count._all);
  }
  return [...totals].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/** The cars saved most in the window. */
export async function findMostSavedCars(w: Window, take: number) {
  const rows = await db.savedCar.groupBy({
    by: ["carId"],
    where: { createdAt: inWindow(w) },
    _count: { _all: true },
    orderBy: { _count: { carId: "desc" } },
    take,
  });
  if (rows.length === 0) return [];
  const cars = await db.car.findMany({
    where: { id: { in: rows.map((r) => r.carId) } },
    select: { id: true, make: true, model: true, year: true, price: true, organization: { select: { id: true, name: true } } },
  });
  const byId = new Map(cars.map((car) => [car.id, car]));
  return rows.flatMap((row) => {
    const car = byId.get(row.carId);
    return car ? [{ ...car, price: Number(car.price), saves: row._count._all }] : [];
  });
}

// ---------- Dealerships ----------

export const countActiveDealerships = () => db.organization.count({ where: { isActive: true } });
export const countSuspendedDealerships = () => db.organization.count({ where: { isActive: false } });
export const countDealershipsJoined = (w: Window) => db.organization.count({ where: { createdAt: inWindow(w) } });
export const countDealershipsWithoutCars = () =>
  db.organization.count({ where: { isActive: true, cars: { none: { status: "AVAILABLE" } } } });

/** Active dealerships by their plan; those without one are counted under null. */
export async function countDealershipsByPlan() {
  const orgs = await db.organization.findMany({
    where: { isActive: true },
    select: { subscription: { select: { plan: { select: { id: true, type: true, name: true } } } } },
  });
  const totals = new Map<string, { plan: { id: string; type: string; name: string } | null; count: number }>();
  for (const org of orgs) {
    const plan = org.subscription?.plan ?? null;
    const key = plan?.id ?? "";
    totals.set(key, { plan, count: (totals.get(key)?.count ?? 0) + 1 });
  }
  return [...totals.values()].sort((a, b) => b.count - a.count);
}

/** Active dealerships by governorate code; those without one under null. */
export async function countDealershipsByRegion() {
  const rows = await db.organization.groupBy({ by: ["region"], where: { isActive: true }, _count: { _all: true } });
  return rows.map((row) => ({ region: row.region, count: row._count._all })).sort((a, b) => b.count - a.count);
}

/** The dealerships with the most test drives asked for in the window, and how those went. */
export async function findBusiestDealerships(w: Window, take: number) {
  const rows = await db.testDrive.groupBy({
    by: ["organizationId"],
    where: { createdAt: inWindow(w) },
    _count: { _all: true },
    orderBy: { _count: { organizationId: "desc" } },
    take,
  });
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.organizationId);
  const [orgs, driven] = await Promise.all([
    db.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, region: true, _count: { select: { cars: { where: { status: "AVAILABLE" } } } } },
    }),
    db.testDrive.groupBy({
      by: ["organizationId"],
      where: { createdAt: inWindow(w), organizationId: { in: ids }, status: "COMPLETED" },
      _count: { _all: true },
    }),
  ]);
  const byId = new Map(orgs.map((org) => [org.id, org]));
  const drivenBy = new Map(driven.map((row) => [row.organizationId, row._count._all]));
  return rows.flatMap((row) => {
    const org = byId.get(row.organizationId);
    return org
      ? [{ id: org.id, name: org.name, region: org.region, carsLive: org._count.cars, testDrives: row._count._all, driven: drivenBy.get(org.id) ?? 0 }]
      : [];
  });
}

// ---------- Buyers ----------

const buyer = { role: "USER" as const, memberships: { none: {} } };
export const countBuyersJoined = (w: Window) => db.user.count({ where: { ...buyer, createdAt: inWindow(w) } });

/** Distinct buyers who saved a car in the window. */
export async function countBuyersWhoSaved(w: Window) {
  const rows = await db.savedCar.groupBy({ by: ["userId"], where: { createdAt: inWindow(w) } });
  return rows.length;
}

/** Distinct buyers who asked for a test drive in the window, and how many asked more than once. */
export async function countBuyersWhoAskedToDrive(w: Window) {
  const rows = await db.testDrive.groupBy({ by: ["userId"], where: { createdAt: inWindow(w) }, _count: { _all: true } });
  return { buyers: rows.length, more: rows.filter((row) => row._count._all > 1).length };
}

// ---------- AI ----------

export const countAiCalls = (w: Window) => db.aiUsage.count({ where: { createdAt: inWindow(w) } });

/** Typical and slowest-5% wait across every AI call in the window. */
export async function findAiLatency(w: Window) {
  const [row] = await db.$queryRaw<{ p50: number | null; p95: number | null }[]>`
    SELECT
      percentile_cont(0.5) WITHIN GROUP (ORDER BY "latencyMs")  AS p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY "latencyMs") AS p95
    FROM "AiUsage"
    WHERE "createdAt" >= ${w.from} AND "createdAt" < ${w.to}
  `;
  return { p50: row?.p50 == null ? null : Math.round(row.p50), p95: row?.p95 == null ? null : Math.round(row.p95) };
}

// ---------- The listing assistant's quality ----------
// Every reply is an AssistantAnswer row, so these are counts, not estimates.
// Ratings are counted against the window the answer was given in.

/** Replies in the window, by what the assistant did. */
export async function countAssistantReplies(w: Window) {
  const rows = await db.assistantAnswer.groupBy({ by: ["outcome"], where: { createdAt: inWindow(w) }, _count: { _all: true } });
  const count = (outcome: AssistantOutcome) => rows.find((row) => row.outcome === outcome)?._count._all ?? 0;
  return { answered: count("ANSWERED"), declined: count("DECLINED"), offTopic: count("OFF_TOPIC") };
}

/** How buyers rated the window's answers. */
export async function countAssistantRatings(w: Window) {
  const rows = await db.assistantAnswer.groupBy({
    by: ["helpful"],
    where: { createdAt: inWindow(w), outcome: "ANSWERED", helpful: { not: null } },
    _count: { _all: true },
  });
  const count = (helpful: boolean) => rows.find((row) => row.helpful === helpful)?._count._all ?? 0;
  return { helpful: count(true), unhelpful: count(false) };
}

/**
 * The window's answers by the model and prompt version that wrote them, with
 * their ratings — what tells a prompt change or a fallback model apart. Rows
 * from before provenance was kept have neither, and group together.
 */
export async function findAssistantQualityByModel(w: Window) {
  const rows = await db.assistantAnswer.groupBy({
    by: ["model", "promptVersion", "helpful"],
    where: { createdAt: inWindow(w), outcome: "ANSWERED" },
    _count: { _all: true },
  });
  const groups = new Map<string, { model: string | null; promptVersion: string | null; answers: number; rated: number; helpful: number }>();
  for (const row of rows) {
    const key = `${row.model}\0${row.promptVersion}`;
    const group = groups.get(key) ?? { model: row.model, promptVersion: row.promptVersion, answers: 0, rated: 0, helpful: 0 };
    group.answers += row._count._all;
    if (row.helpful !== null) group.rated += row._count._all;
    if (row.helpful === true) group.helpful += row._count._all;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.answers - a.answers);
}

/** The latest answers buyers marked unhelpful, with what wrote them. */
export const findUnhelpfulAnswers = (w: Window, take: number) =>
  db.assistantAnswer.findMany({
    where: { createdAt: inWindow(w), outcome: "ANSWERED", helpful: false },
    orderBy: { ratedAt: "desc" },
    take,
    select: {
      id: true,
      carId: true,
      question: true,
      answer: true,
      model: true,
      promptVersion: true,
      ratedAt: true,
      organization: { select: { name: true } },
    },
  });
