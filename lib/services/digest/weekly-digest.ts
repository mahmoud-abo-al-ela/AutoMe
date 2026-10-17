import type { Locale } from "@/i18n/routing";
import * as digestRepository from "@/lib/repositories/digest";
import * as aiUsageRepository from "@/lib/repositories/ai-usage";
import { findActiveSubscription } from "@/lib/repositories/billing";
import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";
import { DEALER_METERED_FEATURES } from "@/lib/middleware/plan-limits";
import { writeWeeklySummary } from "@/lib/services/ai";
import { buildWeeklyDigestEmail } from "@/lib/services/notification/weekly-digest-template";
import { sendEmail } from "@/lib/resend";
import { digestWeek, type DigestWeek } from "@/lib/utils/digest-week";
import { numbersHold } from "@/lib/utils/digest-numbers";
import { logError } from "@/lib/utils/errors";
import type { WeeklySummary } from "@/lib/ai/schemas/weekly-summary";

export interface DigestRunReport {
  week: string;
  due: boolean;
  sent: number;
  /** Already sent this week, or no owner with an address. */
  skipped: number;
  failed: number;
  /** Sent with the figures only: the model failed or quoted a wrong number. */
  withoutSummary: number;
  /** Out of time; the next run picks up where this one stopped. */
  stoppedEarly: boolean;
}

/** The AI listing allowance: used this month, and the plan's limit (-1 unlimited, null none). */
async function aiListings(organizationId: string) {
  const [used, subscription] = await Promise.all([
    aiUsageRepository.countOrgAiCarsThisMonth(organizationId, DEALER_METERED_FEATURES),
    findActiveSubscription(organizationId),
  ]);
  const feature = planFeature(await planInEffect({ id: organizationId, subscription }), "aiProcessing");
  const limit = feature.enabled ? feature.limit : null;
  return { aiListingsUsed: used, aiListingsLimit: limit };
}

async function summarise(
  organizationId: string,
  numbers: Record<string, number | null>,
  locale: Locale
): Promise<WeeklySummary | null> {
  try {
    const summary = await writeWeeklySummary(numbers, locale, {
      organizationId,
      userId: null,
      // A cron nobody waits on; dealers' own AI goes first.
      priority: "low",
    });
    const figures = Object.values(numbers).filter((v): v is number => typeof v === "number");
    return numbersHold(`${summary.summary} ${summary.tip}`, figures) ? summary : null;
  } catch (error) {
    logError("Weekly summary: the model could not write the paragraph", error);
    return null;
  }
}

async function sendOne(
  organization: digestRepository.DigestOrganization,
  recipients: string[],
  week: DigestWeek
): Promise<{ delivered: number; withSummary: boolean }> {
  const locale: Locale = organization.emailLocale === "en" ? "en" : "ar";
  const [activity, allowance] = await Promise.all([
    digestRepository.countWeeklyActivity(organization.id, week.start, week.end),
    aiListings(organization.id),
  ]);
  const numbers = { ...activity, ...allowance };
  const summary = await summarise(organization.id, numbers, locale);

  const email = buildWeeklyDigestEmail({
    locale,
    dealership: organization.name,
    slug: organization.slug,
    week,
    numbers,
    summary,
  });

  let delivered = 0;
  for (const to of recipients) {
    try {
      const result = await sendEmail({ to, subject: email.subject, html: email.html });
      if (!result.error) delivered += 1;
      else logError("Weekly summary email was not sent", result.error);
    } catch (error) {
      logError("Weekly summary email was not sent", error);
    }
  }
  return { delivered, withSummary: summary !== null };
}

export async function runWeeklyDigest(now: Date, options: { deadline: number }): Promise<DigestRunReport> {
  const week = digestWeek(now);
  const report: DigestRunReport = {
    week: week.key,
    due: week.due,
    sent: 0,
    skipped: 0,
    failed: 0,
    withoutSummary: 0,
    stoppedEarly: false,
  };
  if (!week.due) return report;

  const organizations = await digestRepository.findDigestOrganizations();
  for (let i = 0; i < organizations.length; i += CONCURRENCY) {
    if (Date.now() > options.deadline) {
      report.stoppedEarly = true;
      break;
    }
    await Promise.all(organizations.slice(i, i + CONCURRENCY).map((org) => digestOne(org, week, report)));
  }
  return report;
}

const CONCURRENCY = 4;

async function digestOne(
  organization: digestRepository.DigestOrganization,
  week: DigestWeek,
  report: DigestRunReport
): Promise<void> {
  const recipients = organization.memberships
    .map((m) => m.user.email)
    .filter((email): email is string => Boolean(email));
  if (recipients.length === 0 || !(await digestRepository.claimDigestSend(organization.id, week.weekStart))) {
    report.skipped += 1;
    return;
  }

  try {
    const { delivered, withSummary } = await sendOne(organization, recipients, week);
    if (delivered === 0) {
      await digestRepository.releaseDigestSend(organization.id, week.weekStart);
      report.failed += 1;
      return;
    }
    await digestRepository.markDigestSent(organization.id, week.weekStart, delivered);
    report.sent += 1;
    if (!withSummary) report.withoutSummary += 1;
  } catch (error) {
    logError(`Weekly summary failed for ${organization.id}`, error);
    await digestRepository.releaseDigestSend(organization.id, week.weekStart).catch(() => undefined);
    report.failed += 1;
  }
}
