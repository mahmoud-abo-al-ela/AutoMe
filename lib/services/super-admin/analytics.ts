import * as repo from "@/lib/repositories/super-admin/analytics";
import { getFailuresByCode, getUsageByFeature, getUsageByModel } from "@/lib/repositories/ai-usage";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { median, PRICE_BANDS, STALE_AFTER_DAYS, type AnalyticsPeriod, type AnalyticsQuery } from "./analytics-options";
import { periodWindows } from "./overview";

/**
 * The super-admin Analytics page (canvas: Super admin analytics round 1, "1 ·
 * Report tabs"): four reports — the marketplace from listing to sale, the
 * dealerships, the buyers, and AI — each for a period and compared with the
 * period before. Only the open report is loaded.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP = 6;

/** The period up to now, and the same length before it, on Cairo days. */
export function analyticsWindows(days: AnalyticsPeriod, now: Date) {
  const windows = periodWindows(cairoDate(now), days);
  const currentFrom = cairoMidnight(windows.current.start);
  return {
    current: { from: currentFrom, to: now },
    previous: { from: cairoMidnight(windows.previous.start), to: currentFrom },
  };
}

const pair = async (count: (w: repo.Window) => Promise<number>, w: ReturnType<typeof analyticsWindows>) => {
  const [current, previous] = await Promise.all([count(w.current), count(w.previous)]);
  return { current, previous };
};

const daysToSell = (sales: { listedAt: Date; soldAt: Date }[]) =>
  median(sales.map((s) => Math.max(0, (s.soldAt.getTime() - s.listedAt.getTime()) / DAY_MS)));

async function marketplace(w: ReturnType<typeof analyticsWindows>, now: Date) {
  const [carsLive, listed, saves, asked, confirmed, driven, cancelled, sold, salesNow, salesBefore, priceBands, makes, unsaved] =
    await Promise.all([
      repo.countLiveCars(),
      pair(repo.countCarsListed, w),
      pair(repo.countSaves, w),
      pair((x) => repo.countTestDrives(x), w),
      // Confirmed counts those since driven too: they were confirmed first.
      pair((x) => repo.countTestDrives(x, ["CONFIRMED", "COMPLETED"]), w),
      pair((x) => repo.countTestDrives(x, ["COMPLETED"]), w),
      pair((x) => repo.countTestDrives(x, ["CANCELLED"]), w),
      pair(repo.countSales, w),
      repo.findSales(w.current),
      repo.findSales(w.previous),
      Promise.all(PRICE_BANDS.map(async (band) => ({ key: band.key, count: await repo.countLiveCarsPriced(band.min, band.max) }))),
      repo.countTestDrivesByCar(w.current, "make"),
      repo.countUnsavedCars(new Date(now.getTime() - STALE_AFTER_DAYS * DAY_MS)),
    ]);
  return {
    report: "marketplace" as const,
    carsLive,
    listed,
    saves,
    asked,
    confirmed,
    driven,
    cancelled,
    sold,
    daysToSell: { current: daysToSell(salesNow), previous: daysToSell(salesBefore) },
    priceBands,
    makes: makes.slice(0, TOP),
    unsaved,
  };
}

async function dealerships(w: ReturnType<typeof analyticsWindows>) {
  const [active, suspended, joined, withoutCars, plans, regions, busiest] = await Promise.all([
    repo.countActiveDealerships(),
    repo.countSuspendedDealerships(),
    pair(repo.countDealershipsJoined, w),
    repo.countDealershipsWithoutCars(),
    repo.countDealershipsByPlan(),
    repo.countDealershipsByRegion(),
    repo.findBusiestDealerships(w.current, 8),
  ]);
  const sales = await repo.countSalesByDealership(w.current, busiest.map((d) => d.id));
  return {
    report: "dealerships" as const,
    active,
    suspended,
    joined,
    withoutCars,
    plans,
    regions,
    busiest: busiest.map((d) => ({ ...d, sold: sales.get(d.id) ?? 0 })),
  };
}

async function buyers(w: ReturnType<typeof analyticsWindows>) {
  const [joined, saved, askedNow, askedBefore, mostSaved, bodyTypes] = await Promise.all([
    pair(repo.countBuyersJoined, w),
    pair(repo.countBuyersWhoSaved, w),
    repo.countBuyersWhoAskedToDrive(w.current),
    repo.countBuyersWhoAskedToDrive(w.previous),
    repo.findMostSavedCars(w.current, 5),
    repo.countTestDrivesByCar(w.current, "bodyType"),
  ]);
  return {
    report: "buyers" as const,
    joined,
    saved,
    askedToDrive: { current: askedNow.buyers, previous: askedBefore.buyers },
    askedAgain: { current: askedNow.more, previous: askedBefore.more },
    mostSaved,
    bodyTypes: bodyTypes.slice(0, TOP),
  };
}

async function ai(w: ReturnType<typeof analyticsWindows>) {
  // The usage readers take a start only; the current period runs to now.
  const [calls, latency, features, models, failures] = await Promise.all([
    pair(repo.countAiCalls, w),
    repo.findAiLatency(w.current),
    getUsageByFeature(w.current.from),
    getUsageByModel(w.current.from),
    getFailuresByCode(w.current.from),
  ]);
  return {
    report: "ai" as const,
    calls,
    failed: failures.reduce((sum, f) => sum + f.count, 0),
    latency,
    costMicroUsd: features.reduce((sum, f) => sum + f.costMicroUsd, 0),
    features,
    models,
    failures,
  };
}

export async function getAnalytics(query: AnalyticsQuery, now: Date = new Date()) {
  const w = analyticsWindows(query.days, now);
  const data =
    query.report === "dealerships"
      ? await dealerships(w)
      : query.report === "buyers"
        ? await buyers(w)
        : query.report === "ai"
          ? await ai(w)
          : await marketplace(w, now);
  return { query, since: addDays(cairoDate(now), -(query.days - 1)), data };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
export type AnalyticsData = Analytics["data"];
export type Pair = { current: number; previous: number };
