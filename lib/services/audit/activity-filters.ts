/**
 * The Activity page's filter values. Kept apart from activity.ts, which loads
 * the database client: the feed is a client component and imports these.
 */
export const ACTIVITY_KINDS = ["all", "cars", "drives", "team", "plan", "settings"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_DAYS = [7, 30, 90] as const;
