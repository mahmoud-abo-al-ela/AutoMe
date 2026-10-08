import { OVERVIEW_PERIODS, parseOverviewPeriod, type OverviewPeriod } from "./overview-options";

/**
 * The Analytics page's reports and periods, apart from the service so the
 * client controls can import them without pulling the database in. The
 * periods are the Overview's, so both pages offer the same choices.
 */

export const ANALYTICS_REPORTS = ["marketplace", "dealerships", "buyers", "ai"] as const;
export type AnalyticsReport = (typeof ANALYTICS_REPORTS)[number];

export const ANALYTICS_PERIODS = OVERVIEW_PERIODS;
export type AnalyticsPeriod = OverviewPeriod;
export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 30;

/** Live cars' price bands, in EGP; the last has no top. */
export const PRICE_BANDS = [
  { key: "under500k", min: 0, max: 500_000 },
  { key: "to1m", min: 500_000, max: 1_000_000 },
  { key: "to2m", min: 1_000_000, max: 2_000_000 },
  { key: "to4m", min: 2_000_000, max: 4_000_000 },
  { key: "over4m", min: 4_000_000, max: null },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["key"];

/** A live car nobody has saved this long after listing is going stale. */
export const STALE_AFTER_DAYS = 30;

export type AnalyticsQuery = { report: AnalyticsReport; days: AnalyticsPeriod };

export function parseAnalyticsQuery(params: Record<string, string | string[] | undefined>): AnalyticsQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const report = one("report");
  return {
    report: (ANALYTICS_REPORTS as readonly string[]).includes(report ?? "") ? (report as AnalyticsReport) : "marketplace",
    days: parseOverviewPeriod(one("days") ?? DEFAULT_ANALYTICS_PERIOD),
  };
}

export function analyticsQueryString(query: Partial<AnalyticsQuery>) {
  const params = new URLSearchParams();
  if (query.report && query.report !== "marketplace") params.set("report", query.report);
  if (query.days && query.days !== DEFAULT_ANALYTICS_PERIOD) params.set("days", String(query.days));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** The change from one period to the one before, as a share; null when there is nothing to compare with. */
export function changeFrom(previous: number, current: number) {
  return previous > 0 ? (current - previous) / previous : null;
}

/** The middle value, or null for none. */
export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
