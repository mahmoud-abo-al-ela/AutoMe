import type { BillingPeriod } from "@/lib/generated/prisma";
import {
  addDays,
  cairoDate,
  cairoMidnight,
  daysBetween,
  dateOnlyToUtc,
  utcToDateOnly,
} from "@/lib/utils/date-only";

/**
 * The billing calendar for dealership subscriptions, in Cairo dates.
 *
 * Paymob has no subscription object for us: every period is paid through a
 * payment link, so AutoMe keeps the calendar itself. A period covers whole
 * Cairo days, [start, end): it starts at 00:00 Cairo on its first day and
 * ends at 00:00 Cairo on the day after its last. `Subscription.currentPeriodEnd`
 * stores that end instant.
 *
 * Around the end:
 *   - from RENEWAL_NOTICE_DAYS before it, a renewal link is offered and emailed
 *     (again at RENEWAL_REMINDER_DAYS);
 *   - on the end day the subscription is past due, with GRACE_DAYS to pay;
 *   - after the grace the dealership drops to the free plan.
 */

/** Days before the end when the renewal link is first sent, and "Renew now" appears. */
export const RENEWAL_NOTICE_DAYS = 7;
/** Days before the end when the reminder is sent. */
export const RENEWAL_REMINDER_DAYS = 3;
/** Days after the end the dealership keeps its plan while the renewal is unpaid. */
export const GRACE_DAYS = 7;

export interface PeriodBounds {
  /** 00:00 Cairo on the first day. */
  start: Date;
  /** 00:00 Cairo on the day after the last day. */
  end: Date;
}

/**
 * A calendar date one month or one year on. A day the target month lacks is
 * clamped to its last day: Jan 31 + 1 month is Feb 28 (29 in a leap year),
 * and Feb 29 + 1 year is Feb 28.
 *
 * Renewals chain from the previous end, so a period that was clamped stays on
 * the earlier day (Jan 31 → Feb 28 → Mar 28). That costs a dealership at most
 * three days once, and keeps every period exactly one calendar month long.
 */
export function addPeriod(date: string, period: BillingPeriod): string {
  const d = dateOnlyToUtc(date);
  const months = period === "YEARLY" ? 12 : 1;
  const target = d.getUTCMonth() + months;
  const year = d.getUTCFullYear() + Math.floor(target / 12);
  const month = target % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return utcToDateOnly(new Date(Date.UTC(year, month, Math.min(d.getUTCDate(), lastDay))));
}

/** The period that starts on a Cairo calendar date. */
export function periodFrom(startDate: string, period: BillingPeriod): PeriodBounds {
  return { start: cairoMidnight(startDate), end: cairoMidnight(addPeriod(startDate, period)) };
}

/** A period paid now that starts today: sign-up and upgrade. */
export function periodStartingToday(period: BillingPeriod, now: Date = new Date()): PeriodBounds {
  return periodFrom(cairoDate(now), period);
}

/**
 * A free trial from today: whole Cairo days, ending at 00:00 Cairo after the
 * last one. Nothing is paid upfront; the first payment is a renewal from the
 * trial's end, asked for like any other.
 */
export function trialPeriod(days: number, now: Date = new Date()): PeriodBounds {
  const today = cairoDate(now);
  return { start: cairoMidnight(today), end: cairoMidnight(addDays(today, days)) };
}

/**
 * The period a renewal pays for: it starts where the current one ends, so
 * paying early loses no days and paying during the grace does not add the
 * grace days on top.
 */
export function renewalPeriod(currentEnd: Date, period: BillingPeriod): PeriodBounds {
  return periodFrom(cairoDate(currentEnd), period);
}

/**
 * Whole Cairo days from today to the day the period ends. 1 on its last day,
 * 0 on the end day (past due from then), negative into the grace.
 */
export function daysLeft(periodEnd: Date, now: Date = new Date()): number {
  return daysBetween(cairoDate(now), cairoDate(periodEnd));
}

export type RenewalStage =
  /** More than RENEWAL_NOTICE_DAYS left: nothing to do. */
  | "active"
  /** Inside the notice window: the renewal link is offered. */
  | "due"
  /** Inside the reminder window. */
  | "reminder"
  /** Ended, within the grace: past due, the plan still works. */
  | "grace"
  /** The grace is over: drop to the free plan. */
  | "expired";

export function renewalStage(periodEnd: Date, now: Date = new Date()): RenewalStage {
  const left = daysLeft(periodEnd, now);
  if (left > RENEWAL_NOTICE_DAYS) return "active";
  if (left > RENEWAL_REMINDER_DAYS) return "due";
  if (left > 0) return "reminder";
  if (left > -GRACE_DAYS) return "grace";
  return "expired";
}

/** The Cairo date the grace ends on: the day the dealership drops to the free plan. */
export function graceEndsOn(periodEnd: Date): string {
  return addDays(cairoDate(periodEnd), GRACE_DAYS);
}
