/**
 * The overview's periods and metrics, apart from the service so the client
 * controls can import them without pulling the database into the browser.
 */

export const OVERVIEW_PERIODS = [7, 30, 90, 365] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];
export const DEFAULT_OVERVIEW_PERIOD: OverviewPeriod = 30;

export const OVERVIEW_METRICS = ["revenue", "dealerships", "cars", "buyers", "testDrives"] as const;
export type OverviewMetric = (typeof OVERVIEW_METRICS)[number];

/** A period from the URL, or the default when it is missing or not one we offer. */
export function parseOverviewPeriod(value: unknown): OverviewPeriod {
  const days = Number(value);
  return (OVERVIEW_PERIODS as readonly number[]).includes(days) ? (days as OverviewPeriod) : DEFAULT_OVERVIEW_PERIOD;
}
