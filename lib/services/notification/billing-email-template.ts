import { createTranslator } from "next-intl";
import type { BillingPeriod } from "@/lib/generated/prisma";
import type { Locale } from "@/i18n/routing";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { formatPlanAmount } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/datetime";
import { escapeHtml } from "./email-templates";
import enEmails from "@/messages/en/emails.json";
import arEmails from "@/messages/ar/emails.json";
import enPlans from "@/messages/en/plans.json";
import arPlans from "@/messages/ar/plans.json";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const BRAND = "#0532a3";
const MESSAGES = { en: { ...enEmails, ...enPlans }, ar: { ...arEmails, ...arPlans } } as const;

export interface EmailPlan {
  type: string;
  name: string;
}

/** What a billing email says; the template words and formats it per language. */
export type BillingEmail =
  | {
      kind: "renewalDue" | "renewalReminder" | "trialDue" | "trialReminder";
      plan: EmailPlan;
      amountCents: number;
      period: BillingPeriod;
      /** When the paid period (or the trial) ends. */
      endsAt: Date;
    }
  | { kind: "pastDue"; plan: EmailPlan; payBy: Date }
  | { kind: "downgradedCanceled" | "downgradedUnpaid"; plan: EmailPlan }
  | { kind: "paymentReceived"; plan: EmailPlan; amountCents: number; until: Date; startsOn: Date | null }
  | { kind: "paymentFailed"; plan: EmailPlan; amountCents: number };

/** The button each email ends with: where on the billing page it goes. */
const CTA: Record<BillingEmail["kind"], "renew" | "pay" | "plans" | "billing" | "retry"> = {
  renewalDue: "renew",
  renewalReminder: "renew",
  trialDue: "pay",
  trialReminder: "pay",
  pastDue: "pay",
  downgradedCanceled: "plans",
  downgradedUnpaid: "plans",
  paymentReceived: "billing",
  paymentFailed: "retry",
};

export interface BillingEmailInput {
  locale: Locale;
  dealership: string;
  slug: string;
  email: BillingEmail;
}

/**
 * A billing email to a dealership's owners, in its chosen language and
 * direction. Every call to action opens the billing page, where paying starts
 * a fresh Paymob checkout: a checkout link put in an email would expire long
 * before some owners read it. Inline styles only — email clients ignore
 * stylesheets.
 */
export function buildBillingEmail({ locale, dealership, slug, email }: BillingEmailInput): {
  subject: string;
  html: string;
} {
  // Keys are built from the email kind, which the generated key types cannot
  // follow; the messages tests check every kind exists in both languages.
  const t = createTranslator({ locale, messages: MESSAGES[locale] }) as unknown as (
    key: string,
    values?: Record<string, string>
  ) => string;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  // In Cairo, in the reader's digits, as dates read everywhere else in the app.
  const day = { format: (value: Date) => formatDate(value, locale, { month: "long" }) };

  const planKey = planKeyFor(email.plan.type);
  const values: Record<string, string> = {
    dealership,
    plan: planKey ? t(`plans.${planKey}.name`) : email.plan.name,
  };
  if ("amountCents" in email) values.amount = formatPlanAmount(email.amountCents, locale);
  if ("period" in email) values.period = email.period;
  if ("endsAt" in email) values.date = day.format(email.endsAt);
  if ("payBy" in email) values.date = day.format(email.payBy);
  if ("until" in email) values.date = day.format(email.until);

  const bodyKey =
    email.kind === "paymentReceived" && email.startsOn ? "paymentReceived.bodyAhead" : `${email.kind}.body`;
  if (email.kind === "paymentReceived" && email.startsOn) values.start = day.format(email.startsOn);

  const billing = `${APP_URL}/${locale}/org/${encodeURIComponent(slug)}/billing${CTA[email.kind] === "plans" ? "#plans" : ""}`;

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div dir="${dir}" style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:${locale === "ar" ? "Tahoma,Arial" : "Arial,Helvetica"},sans-serif;text-align:${align};">
    <div style="background:#ffffff;border-radius:12px;padding:28px 24px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">${escapeHtml(t(`billing.${email.kind}.heading`, values))}</h1>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(t(`billing.${bodyKey}`, values))}</p>
      <p style="margin:28px 0 0;text-align:center;">
        <a href="${billing}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(t(`billing.cta.${CTA[email.kind]}`))}</a>
      </p>
    </div>
    <p style="margin:16px 8px 0;font-size:12px;line-height:1.6;color:#64748b;">${escapeHtml(t("billing.footer", values))}</p>
  </div>
</body>
</html>`;

  return { subject: t(`billing.${email.kind}.subject`, values), html };
}
