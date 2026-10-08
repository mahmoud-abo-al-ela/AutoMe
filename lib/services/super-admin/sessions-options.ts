/**
 * The support sessions list's views and periods, apart from the service so
 * the client controls can import them without pulling the database in.
 */

export const SESSION_VIEWS = ["all", "open", "mine", "week"] as const;
export type SessionView = (typeof SESSION_VIEWS)[number];

export const SESSION_PERIODS = ["all", "7", "30", "90"] as const;
export type SessionPeriod = (typeof SESSION_PERIODS)[number];

export const SESSIONS_PER_PAGE = 10;

export type SessionQuery = {
  view: SessionView;
  search: string;
  /** Only sessions this admin started. */
  admin: string | null;
  days: SessionPeriod;
  page: number;
};

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;

export function parseSessionQuery(params: Record<string, string | string[] | undefined>): SessionQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  const admin = one("admin") ?? "";
  return {
    view: pick(SESSION_VIEWS, one("view"), "all"),
    search: (one("search") ?? "").trim().slice(0, 100),
    admin: /^[\w-]{1,64}$/.test(admin) ? admin : null,
    days: pick(SESSION_PERIODS, one("days"), "all"),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}

export function sessionQueryString(query: Partial<SessionQuery>) {
  const params = new URLSearchParams();
  if (query.view && query.view !== "all") params.set("view", query.view);
  if (query.search) params.set("search", query.search);
  if (query.admin) params.set("admin", query.admin);
  if (query.days && query.days !== "all") params.set("days", query.days);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}
