import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHourInput } from "@/lib/repositories/dealership/working-hours";
import type { DealershipTermsInput, OrganizationProfileInput } from "@/lib/validations/schemas";
import {
  DEALERSHIP_TERM_FLAGS,
  UNSET,
  triStateFromForm,
  triStateToForm,
  type DealershipTerms,
  type TriStateFormValue,
} from "@/lib/utils/car-disclosures";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";

/**
 * The storefront form's three parts — profile, opening hours, terms — as the
 * editor holds them, and the pure conversions to and from what the server
 * stores. Each part saves through its own action, so each is compared with its
 * own saved copy to know what changed.
 */

/** Saturday first: Egypt's week, as the date picker and the public page show it. */
export const WEEK: readonly DayOfWeek[] = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export type ProfileState = { [K in keyof OrganizationProfileInput]-?: string };
export type DayHours = { isOpen: boolean; openTime: string; closeTime: string };
export type HoursState = Record<DayOfWeek, DayHours>;
export type TermFlag = (typeof DEALERSHIP_TERM_FLAGS)[number];
export type TermsState = Record<TermFlag, TriStateFormValue> & { financingNote: string };
export type StorefrontState = { profile: ProfileState; hours: HoursState; terms: TermsState };
export type StorefrontPart = keyof StorefrontState;
export const PARTS: readonly StorefrontPart[] = ["profile", "hours", "terms"];

type Nullable<T> = { [K in keyof T]?: T[K] | null };

export function profileFromStored(stored: Nullable<ProfileState> | null | undefined): ProfileState {
  return {
    name: stored?.name ?? "",
    email: stored?.email ?? "",
    phone: stored?.phone ?? "",
    website: stored?.website ?? "",
    address: stored?.address ?? "",
    description: stored?.description ?? "",
    city: stored?.city ?? "",
    region: stored?.region ?? "",
    country: stored?.country || "EG",
  };
}

/** A dealership that never set its hours starts from a plain week: 9 to 6, Friday closed. */
const DEFAULT_DAY: DayHours = { isOpen: true, openTime: "09:00", closeTime: "18:00" };

export function hoursFromStored(
  rows: { dayOfWeek: DayOfWeek[] | DayOfWeek; openTime: string; closeTime: string; isOpen: boolean }[] | null | undefined,
): HoursState {
  const hours = Object.fromEntries(
    WEEK.map((day) => [day, { ...DEFAULT_DAY, isOpen: day !== "FRIDAY" }]),
  ) as HoursState;
  for (const row of rows ?? []) {
    for (const day of Array.isArray(row.dayOfWeek) ? row.dayOfWeek : [row.dayOfWeek]) {
      hours[day] = { isOpen: row.isOpen, openTime: row.openTime || DEFAULT_DAY.openTime, closeTime: row.closeTime || DEFAULT_DAY.closeTime };
    }
  }
  return hours;
}

export function hoursToInput(hours: HoursState): WorkingHourInput[] {
  return WEEK.map((day) => ({ dayOfWeek: [day], ...hours[day] }));
}

/** The shape the public page's badge and lists read. */
export function hoursToEntries(hours: HoursState): WorkingHoursEntry[] {
  return WEEK.map((day) => ({ dayKey: day, ...hours[day] }));
}

/**
 * Open days whose closing time is not after the opening time. The open/closed
 * badge has no notion of hours past midnight, so such a day would read as
 * closed all day.
 */
export function invalidDays(hours: HoursState): DayOfWeek[] {
  return WEEK.filter((day) => hours[day].isOpen && hours[day].closeTime <= hours[day].openTime);
}

export type HoursGroup = { days: DayOfWeek[] } & DayHours;

/** Runs of neighbouring days with the same hours, Saturday to Friday: "Sat to Thu, 10 AM to 9 PM". */
export function groupHours(hours: HoursState): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const day of WEEK) {
    const today = hours[day];
    const last = groups.at(-1);
    const same =
      last &&
      last.isOpen === today.isOpen &&
      (!today.isOpen || (last.openTime === today.openTime && last.closeTime === today.closeTime));
    if (same) last.days.push(day);
    else groups.push({ days: [day], ...today });
  }
  return groups;
}

export function termsFromStored(stored: Nullable<DealershipTerms> | null | undefined): TermsState {
  return {
    offersFinancing: triStateToForm(stored?.offersFinancing),
    acceptsTradeIn: triStateToForm(stored?.acceptsTradeIn),
    allowsInspection: triStateToForm(stored?.allowsInspection),
    offersDelivery: triStateToForm(stored?.offersDelivery),
    financingNote: stored?.financingNote ?? "",
  };
}

export function termsToInput(terms: TermsState): DealershipTermsInput {
  return {
    offersFinancing: triStateFromForm(terms.offersFinancing),
    acceptsTradeIn: triStateFromForm(terms.acceptsTradeIn),
    allowsInspection: triStateFromForm(terms.allowsInspection),
    offersDelivery: triStateFromForm(terms.offersDelivery),
    financingNote: terms.offersFinancing === "yes" ? terms.financingNote.trim() || null : null,
  };
}

/** The terms the dealer left "not stated" — the ones the assistant answers with "ask the dealer". */
export function unstatedTerms(terms: TermsState): TermFlag[] {
  return DEALERSHIP_TERM_FLAGS.filter((flag) => terms[flag] === UNSET);
}

/** Which parts differ from their saved copy, compared by what would be sent. */
export function changedParts(current: StorefrontState, saved: StorefrontState): StorefrontPart[] {
  const sent = {
    profile: (state: StorefrontState) => state.profile,
    hours: (state: StorefrontState) => hoursToInput(state.hours),
    terms: (state: StorefrontState) => termsToInput(state.terms),
  };
  return PARTS.filter((part) => JSON.stringify(sent[part](current)) !== JSON.stringify(sent[part](saved)));
}
