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
