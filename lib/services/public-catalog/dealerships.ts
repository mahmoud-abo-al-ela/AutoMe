import type { Locale } from "@/i18n/routing";
import { getDealershipBySlug, getDealerships } from "@/lib/services/dealership";
import { resolveDealershipText } from "@/lib/utils/dealership-text";
import { statedTerms, type DealershipTerms } from "@/lib/utils/car-disclosures";
import { ValidationError } from "@/lib/utils/errors";
import { publicDealership, type DealerText, type PublicDealership, type PublicDealershipRow } from "./projections";
import { resolvePlace } from "./place";
import type { LinkSource } from "./urls";

export const DEALERSHIP_LIST_LIMITS = { defaultLimit: 10, maxLimit: 20, maxPage: 20, window: 400 } as const;

export interface PublicDealershipSearch {
  query?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface PublicDealershipResults {
  dealerships: PublicDealership[];
  /** Matching dealerships, counted up to the window. */
  total: number;
  page: number;
  hasMore: boolean;
}

export interface PublicDealershipDetail extends PublicDealership {
  phone: string | null;
  address: string | null;
  website: string | null;
  about: DealerText | null;
  /** Only what the dealer stated. */
  terms: Partial<DealershipTerms>;
  /** Opening hours as the dealership's page shows them, one entry per day. */
  workingHours: { day: string; open: boolean; opens: string | null; closes: string | null }[];
}

export async function listPublicDealerships(input: PublicDealershipSearch, locale: Locale, from?: LinkSource): Promise<PublicDealershipResults> {
  const page = input.page ?? 1;
  const limit = input.limit ?? DEALERSHIP_LIST_LIMITS.defaultLimit;
  const { maxLimit, maxPage, window } = DEALERSHIP_LIST_LIMITS;
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) throw new ValidationError(`limit must be 1–${maxLimit}`, "limit");
  if (!Number.isInteger(page) || page < 1 || page > maxPage || (page - 1) * limit >= window) {
    throw new ValidationError(`page is beyond the first ${window} results`, "page");
  }

  const result = await getDealerships({ search: input.query?.trim() || undefined, ...resolvePlace(input.city) }, { page, limit });
  const total = Math.min(result.pagination.total, window);
  return {
    dealerships: result.dealerships.map((row: PublicDealershipRow) => publicDealership(row, locale, from)),
    total,
    page,
    hasMore: page * limit < total,
  };
}

/** A day as formatWorkingHours (lib/utils/working-hours.ts) gives it. */
interface HoursRow {
  dayKey: string;
  isOpen?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

/** One public dealership by slug; not found when suspended, deleted or unknown. */
export async function getPublicDealership(slug: string, locale: Locale, from?: LinkSource): Promise<PublicDealershipDetail> {
  const dealership = await getDealershipBySlug(slug);
  const about = resolveDealershipText(dealership, "description", locale);
  const address = resolveDealershipText(dealership, "address", locale);
  return {
    ...publicDealership(dealership, locale, from),
    phone: dealership.phone ?? null,
    address: address?.text ?? null,
    website: dealership.website ?? null,
    about: about ? { text: about.text.slice(0, 1500), locale: about.locale } : null,
    terms: statedTerms(dealership, locale),
    workingHours: ((dealership.workingHours ?? []) as HoursRow[]).map((row) => ({
      day: row.dayKey,
      open: Boolean(row.isOpen),
      opens: row.isOpen ? (row.openTime ?? null) : null,
      closes: row.isOpen ? (row.closeTime ?? null) : null,
    })),
  };
}
