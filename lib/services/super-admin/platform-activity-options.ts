/**
 * The super-admin Activity page's filters, apart from the service so the
 * client controls can import them without pulling the database in.
 */

/** Who made the change. Staff includes what they did during support sessions. */
export const PLATFORM_ACTIVITY_WHO = ["all", "staff", "support", "others"] as const;
export type PlatformActivityWho = (typeof PLATFORM_ACTIVITY_WHO)[number];

export const PLATFORM_ACTIVITY_KINDS = ["all", "cars", "drives", "team", "plan", "dealership", "accounts", "sessions"] as const;
export type PlatformActivityKind = (typeof PLATFORM_ACTIVITY_KINDS)[number];

export const PLATFORM_ACTIVITY_PERIODS = ["all", "7", "30", "90"] as const;
export type PlatformActivityPeriod = (typeof PLATFORM_ACTIVITY_PERIODS)[number];

export const PLATFORM_ACTIVITY_PER_PAGE = 10;
/** The most entries one CSV export holds. */
export const PLATFORM_ACTIVITY_EXPORT_LIMIT = 5000;

export type PlatformActivityQuery = {
  search: string;
  who: PlatformActivityWho;
  kind: PlatformActivityKind;
  /** Only changes at this dealership. */
  dealership: string | null;
  days: PlatformActivityPeriod;
  page: number;
};

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback;

export function parsePlatformActivityQuery(params: Record<string, string | string[] | undefined>): PlatformActivityQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number.parseInt(one("page") ?? "", 10);
  const dealership = one("dealership") ?? "";
  return {
    search: (one("search") ?? "").trim().slice(0, 100),
    who: pick(PLATFORM_ACTIVITY_WHO, one("who"), "all"),
    kind: pick(PLATFORM_ACTIVITY_KINDS, one("kind"), "all"),
    dealership: /^[\w-]{1,64}$/.test(dealership) ? dealership : null,
    days: pick(PLATFORM_ACTIVITY_PERIODS, one("days"), "all"),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10000) : 1,
  };
}

export function platformActivityQueryString(query: Partial<PlatformActivityQuery>) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.who && query.who !== "all") params.set("who", query.who);
  if (query.kind && query.kind !== "all") params.set("kind", query.kind);
  if (query.dealership) params.set("dealership", query.dealership);
  if (query.days && query.days !== "all") params.set("days", query.days);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}
