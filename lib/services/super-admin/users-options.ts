/**
 * The users list's views and sorts, apart from the service so the client
 * controls can import them without pulling the database in.
 */

export const USER_VIEWS = ["all", "buyers", "teams", "admins", "new"] as const;
export type UserView = (typeof USER_VIEWS)[number];

export const USER_SORTS = ["newest", "oldest", "name", "active"] as const;
export type UserSort = (typeof USER_SORTS)[number];

export const USERS_PER_PAGE = 10;

export type UserQuery = {
  view: UserView;
  search: string;
  /** A dealership's id: only its team. */
  dealership: string | null;
  sort: UserSort;
  page: number;
};

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;

/** The list's query from the URL, with anything unknown dropped for its default. */
export function parseUserQuery(params: Record<string, string | string[] | undefined>): UserQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  const dealership = one("dealership") ?? "";
  return {
    view: pick(USER_VIEWS, one("view"), "all"),
    search: (one("search") ?? "").trim().slice(0, 100),
    dealership: /^[\w-]{1,64}$/.test(dealership) ? dealership : null,
    sort: pick(USER_SORTS, one("sort"), "newest"),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

/** The URL for a query, leaving defaults out so the plain list stays /super-admin/users. */
export function userQueryString(query: Partial<UserQuery>) {
  const params = new URLSearchParams();
  if (query.view && query.view !== "all") params.set("view", query.view);
  if (query.search) params.set("search", query.search);
  if (query.dealership) params.set("dealership", query.dealership);
  if (query.sort && query.sort !== "newest") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** The tabs of one person's page. Which of them show depends on the kind of account. */
export const USER_TABS = ["summary", "dealerships", "drives", "saved", "reviews", "sessions", "activity"] as const;
export type UserTab = (typeof USER_TABS)[number];
export const USER_DETAIL_PER_PAGE = 10;

export function parseUserDetailQuery(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  return {
    tab: pick(USER_TABS, one("tab"), "summary"),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}
