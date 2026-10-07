// Dashboard service - Business logic layer
import * as dashboardRepository from "@/lib/repositories/dashboard";
import * as todayRepository from "@/lib/repositories/dashboard/today";
import * as insightsRepository from "@/lib/repositories/dashboard/insights";
import * as inventoryRepository from "@/lib/repositories/dashboard/inventory";
import { INVENTORY_PAGE_SIZE, type InventoryInput } from "@/lib/validations/schemas";
import { cairoNow } from "@/lib/utils/datetime";
import { dayOfWeekForDate } from "@/lib/utils/booking-slots";
import { priceVerdict } from "@/lib/utils/price-verdict";
import { marketPositionsFor } from "@/lib/services/car/market-price";
import { verifyAccess } from "./access";

/**
 * Get test drive trends
 */
export async function getTestDriveTrendsData(
  userId: string,
  organizationId: string,
  days = 30
) {
  await verifyAccess(userId, organizationId);
  return await dashboardRepository.getTestDriveTrends(organizationId, days);
}

const DAY_MS = 86_400_000;

/** Listed this long with no test drive at all, a car needs a look. */
const STALE_DAYS = 30;
/** Fewer photos than this and buyers scroll past. */
const MIN_PHOTOS = 3;

export type AttentionReason =
  | { kind: "stale"; days: number }
  | { kind: "price"; percent: number }
  | { kind: "photos"; count: number };

/**
 * Why an available car may not be selling, most serious first: listed for a
 * month with no test drive, priced above similar cars (the public gauge's
 * own band, lib/utils/price-verdict), or too few photos. One reason per car —
 * the first that applies — so the list says what to fix first.
 */
function attentionFor(
  car: { createdAt: Date; testDrives: number; images: string[] },
  marketPercent: number | null,
  now: number,
): AttentionReason | null {
  const days = Math.floor((now - car.createdAt.getTime()) / DAY_MS);
  if (days >= STALE_DAYS && car.testDrives === 0) return { kind: "stale", days };
  if (marketPercent !== null && priceVerdict(marketPercent) === "above") return { kind: "price", percent: marketPercent };
  if (car.images.length < MIN_PHOTOS) return { kind: "photos", count: car.images.length };
  return null;
}

const REASON_ORDER = { stale: 0, price: 1, photos: 2 } as const;
const severity = (reason: AttentionReason) =>
  reason.kind === "stale" ? reason.days : reason.kind === "price" ? reason.percent : -reason.count;

/**
 * Every available car that needs a look, with its one reason, most serious
 * first — the overview shows the first three, the Cars page's "Needs
 * attention" view all of them, from this one function so they never differ.
 */
export async function carsNeedingAttention(organizationId: string, now = new Date()) {
  const candidates = await todayRepository.findAttentionCandidates(organizationId);
  const positions = await marketPositionsFor(candidates);
  return candidates
    .map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      image: car.images[0] ?? null,
      daysListed: Math.floor((now.getTime() - car.createdAt.getTime()) / DAY_MS),
      reason: attentionFor(car, positions.get(car.id)?.percent ?? null, now.getTime()),
    }))
    .filter((car): car is typeof car & { reason: AttentionReason } => car.reason !== null)
    .sort(
      (a, b) =>
        REASON_ORDER[a.reason.kind] - REASON_ORDER[b.reason.kind] || severity(b.reason) - severity(a.reason),
    );
}

export type AttentionCar = Awaited<ReturnType<typeof carsNeedingAttention>>[number];

/**
 * The dealer overview: what is waiting on them, today's test drives within
 * today's opening hours (Cairo), the last 30 days against the 30 before, and
 * the cars that need a look. The month boundary for "added this month" is
 * taken at UTC midnight, a couple of hours off Cairo's — immaterial for a
 * monthly count.
 */
export async function getTodayBoard(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);
  const now = new Date();
  const cairo = cairoNow(now);
  const [rows, flagged] = await Promise.all([
    todayRepository.getTodayBoard(organizationId, {
      today: new Date(`${cairo.date}T00:00:00.000Z`),
      weekday: dayOfWeekForDate(cairo.date),
      since: new Date(now.getTime() - 30 * DAY_MS),
      before: new Date(now.getTime() - 60 * DAY_MS),
      monthStart: new Date(`${cairo.date.slice(0, 7)}-01T00:00:00.000Z`),
    }),
    carsNeedingAttention(organizationId, now),
  ]);

  return {
    ...rows,
    organizationId,
    cairoTime: cairo.time,
    attention: { total: flagged.length, items: flagged.slice(0, 3) },
  };
}

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * The Insights page for a period of `days` (7, 30 or 90): four figures with
 * the period before for comparison, test drives per day, the buyer funnel,
 * the stock by status, and interest per car. Days are UTC calendar days, as
 * the overview's chart has always been.
 */
export async function getInsights(userId: string, organizationId: string, days: number) {
  await verifyAccess(userId, organizationId);
  const now = new Date();
  const since = new Date(now.getTime() - days * DAY_MS);
  const before = new Date(now.getTime() - 2 * days * DAY_MS);
  const rows = await insightsRepository.getInsightRows(organizationId, { since, before });

  const completed = rows.drives.filter((drive) => drive.status === "COMPLETED");

  // One point per day, empty days included, oldest first.
  const series = new Map<string, { date: string; requested: number; completed: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * DAY_MS));
    series.set(key, { date: key, requested: 0, completed: 0 });
  }
  for (const drive of rows.drives) {
    const point = series.get(dayKey(drive.createdAt));
    if (!point) continue;
    point.requested += 1;
    if (drive.status === "COMPLETED") point.completed += 1;
  }

  const unique = (ids: string[]) => new Set(ids).size;
  const count = <K extends string>(items: { [key in K]: string }[], key: K) => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
    return counts;
  };
  const savesByCar = count(rows.saves, "carId");
  const drivesByCar = count(rows.drives, "carId");
  // Questions, not times asked: the same unit as the figure above the table.
  const questionsByCar = count(rows.questions, "carId");

  const positions = await marketPositionsFor(rows.cars);
  const cars = rows.cars
    .map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      status: car.status,
      saves: savesByCar.get(car.id) ?? 0,
      questions: questionsByCar.get(car.id) ?? 0,
      drives: drivesByCar.get(car.id) ?? 0,
      daysListed: Math.floor((now.getTime() - car.createdAt.getTime()) / DAY_MS),
      marketPercent: positions.get(car.id)?.percent ?? null,
    }))
    .sort((a, b) => b.saves - a.saves || b.drives - a.drives || b.questions - a.questions);

  const stock = { AVAILABLE: 0, SOLD: 0, UNAVAILABLE: 0 };
  for (const row of rows.stock) stock[row.status] = row._count._all;

  return {
    days,
    figures: {
      requests: { value: rows.drives.length, previous: rows.drivesBefore },
      completed: { value: completed.length, previous: rows.completedBefore },
      saves: { value: rows.saves.length, previous: rows.savesBefore },
      questions: { value: rows.questions.length, previous: rows.questionsBefore },
    },
    series: [...series.values()],
    funnel: {
      saved: unique(rows.saves.map((save) => save.userId)),
      requested: unique(rows.drives.map((drive) => drive.userId)),
      drove: unique(completed.map((drive) => drive.userId)),
    },
    stock,
    cars,
  };
}

export type Insights = Awaited<ReturnType<typeof getInsights>>;

/** The Cars page's "Needs attention" view: every flagged car, after the access check. */
export async function getCarsNeedingAttention(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);
  return carsNeedingAttention(organizationId);
}

/** The status a Cars-table view shows; "all" shows every one. */
const VIEW_STATUS = { all: undefined, available: "AVAILABLE", unavailable: "UNAVAILABLE", sold: "SOLD" } as const;

/** At most this many rows go into one CSV — far past any dealership's stock today. */
const EXPORT_LIMIT = 2000;

type InventoryCar = Awaited<ReturnType<typeof inventoryRepository.findInventory>>["cars"][number];

/**
 * A row of the Cars table: the car, its interest so far, where its price sits
 * among similar cars, and — for a car on sale — the one thing to fix first,
 * by the same rule as the overview and the "Needs attention" view.
 */
async function toInventoryRows(cars: InventoryCar[], now: number) {
  const positions = await marketPositionsFor(cars);
  return cars.map((car) => {
    const marketPercent = positions.get(car.id)?.percent ?? null;
    return {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      bodyType: car.bodyType,
      title: car.title,
      titleEn: car.titleEn,
      titleAr: car.titleAr,
      price: car.price,
      priceCurrency: car.priceCurrency,
      image: car.images[0] ?? null,
      status: car.status,
      featured: car.featured,
      saves: car.saves,
      testDrives: car.testDrives,
      daysListed: Math.floor((now - car.createdAt.getTime()) / DAY_MS),
      marketPercent,
      attention: car.status === "AVAILABLE" ? attentionFor(car, marketPercent, now) : null,
    };
  });
}

function inventoryQuery(input: InventoryInput) {
  return {
    status: VIEW_STATUS[input.view],
    search: input.search || undefined,
    bodyType: input.bodyType || undefined,
    minYear: input.minYear,
    featured: input.featured || undefined,
    sort: input.sort,
    dir: input.dir,
  };
}

/** One page of the dealer's Cars table. */
export async function getInventory(userId: string, organizationId: string, input: InventoryInput) {
  await verifyAccess(userId, organizationId);
  const { total, cars } = await inventoryRepository.findInventory(organizationId, {
    ...inventoryQuery(input),
    skip: (input.page - 1) * INVENTORY_PAGE_SIZE,
    take: INVENTORY_PAGE_SIZE,
  });

  return {
    total,
    page: input.page,
    pageSize: INVENTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE)),
    cars: await toInventoryRows(cars, Date.now()),
  };
}

export type Inventory = Awaited<ReturnType<typeof getInventory>>;
export type InventoryRow = Inventory["cars"][number];

/** Every car the Cars table currently shows, unpaged, for its CSV. */
export async function exportInventory(userId: string, organizationId: string, input: InventoryInput) {
  await verifyAccess(userId, organizationId);
  const { cars } = await inventoryRepository.findInventory(organizationId, {
    ...inventoryQuery(input),
    skip: 0,
    take: EXPORT_LIMIT,
  });
  return toInventoryRows(cars, Date.now());
}

/** How many cars are in each status, for the Cars page's views. */
export async function getInventoryCounts(userId: string, organizationId: string) {
  await verifyAccess(userId, organizationId);
  const rows = await inventoryRepository.countInventoryByStatus(organizationId);
  const counts = { all: 0, AVAILABLE: 0, UNAVAILABLE: 0, SOLD: 0 };
  for (const row of rows) {
    counts[row.status] = row._count._all;
    counts.all += row._count._all;
  }
  return counts;
}
