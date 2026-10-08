/**
 * The dealerships list's views, sorts and plans, apart from the service so
 * the client controls can import them without pulling the database in.
 */

export const DEALERSHIP_VIEWS = ["all", "active", "trial", "overdue", "noCars", "suspended"] as const;
export type DealershipView = (typeof DEALERSHIP_VIEWS)[number];

export const DEALERSHIP_SORTS = ["newest", "oldest", "name", "cars"] as const;
export type DealershipSort = (typeof DEALERSHIP_SORTS)[number];

export const DEALERSHIP_PLANS = ["STARTER", "PRO", "ENTERPRISE"] as const;
export type DealershipPlan = (typeof DEALERSHIP_PLANS)[number];

export const DEALERSHIPS_PER_PAGE = 10;

/** Days of test drives the list counts per dealership. */
export const RECENT_DRIVE_DAYS = 30;

export type DealershipQuery = {
  view: DealershipView;
  search: string;
  plan: DealershipPlan | null;
  region: string | null;
  sort: DealershipSort;
  page: number;
};

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;

/** The list's query from the URL, with anything unknown dropped for its default. */
export function parseDealershipQuery(params: Record<string, string | string[] | undefined>): DealershipQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  const region = one("region")?.trim();
  return {
    view: pick(DEALERSHIP_VIEWS, one("view"), "all"),
    search: (one("search") ?? "").trim().slice(0, 100),
    plan: pick<DealershipPlan | "">(DEALERSHIP_PLANS, one("plan"), "") || null,
    region: region && /^[A-Z]{2,4}$/.test(region) ? region : null,
    sort: pick(DEALERSHIP_SORTS, one("sort"), "newest"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** The URL for a query, leaving defaults out so the plain list stays /super-admin/organizations. */
export function dealershipQueryString(query: Partial<DealershipQuery>) {
  const params = new URLSearchParams();
  if (query.view && query.view !== "all") params.set("view", query.view);
  if (query.search) params.set("search", query.search);
  if (query.plan) params.set("plan", query.plan);
  if (query.region) params.set("region", query.region);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** The tabs of one dealership's page, from `?tab=`; the summary when missing or unknown. */
export const DEALERSHIP_TABS = ["summary", "cars", "team", "billing", "activity"] as const;
export type DealershipTab = (typeof DEALERSHIP_TABS)[number];

export const DETAIL_CARS_PER_PAGE = 10;

export function parseDealershipTab(value: unknown): DealershipTab {
  return (DEALERSHIP_TABS as readonly unknown[]).includes(value) ? (value as DealershipTab) : "summary";
}

export const DETAIL_CAR_STATUSES = ["all", "AVAILABLE", "UNAVAILABLE", "SOLD"] as const;
export type DetailCarStatus = (typeof DETAIL_CAR_STATUSES)[number];
export const DETAIL_CAR_SORTS = ["newest", "interest", "longest", "price"] as const;
export type DetailCarSort = (typeof DETAIL_CAR_SORTS)[number];
export const DETAIL_ACTIVITY_KINDS = ["all", "cars", "drives", "team", "plan", "settings"] as const;
export type DetailActivityKind = (typeof DETAIL_ACTIVITY_KINDS)[number];
export const DETAIL_ACTIVITY_DAYS = ["7", "30", "90", "all"] as const;
export type DetailActivityDays = (typeof DETAIL_ACTIVITY_DAYS)[number];

export type DealershipDetailQuery = {
  tab: DealershipTab;
  page: number;
  status: DetailCarStatus;
  search: string;
  sort: DetailCarSort;
  kind: DetailActivityKind;
  who: string;
  days: DetailActivityDays;
};

/** One dealership's page from the URL: the tab, and the filters of the Cars and Activity tabs. */
export function parseDealershipDetailQuery(params: Record<string, string | string[] | undefined>): DealershipDetailQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  const who = one("who") ?? "";
  return {
    tab: parseDealershipTab(one("tab")),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
    status: pick(DETAIL_CAR_STATUSES, one("status"), "all"),
    search: (one("q") ?? "").trim().slice(0, 60),
    sort: pick(DETAIL_CAR_SORTS, one("sort"), "newest"),
    kind: pick(DETAIL_ACTIVITY_KINDS, one("kind"), "all"),
    who: /^[\w-]{1,64}$/.test(who) ? who : "",
    days: pick(DETAIL_ACTIVITY_DAYS, one("days"), "30"),
  };
}

/** The URL for a tab and its filters, leaving defaults out. */
export function dealershipDetailHref(base: string, query: Partial<DealershipDetailQuery>) {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "summary") params.set("tab", query.tab);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.search) params.set("q", query.search);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.kind && query.kind !== "all") params.set("kind", query.kind);
  if (query.who) params.set("who", query.who);
  if (query.days && query.days !== "30") params.set("days", query.days);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `${base}?${text}` : base;
}
