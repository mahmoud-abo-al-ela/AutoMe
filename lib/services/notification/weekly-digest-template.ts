import { createTranslator } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { WeeklyActivity } from "@/lib/repositories/digest";
import type { WeeklySummary } from "@/lib/ai/schemas/weekly-summary";
import { escapeHtml } from "./email-templates";
import en from "@/messages/en/emails.json";
import ar from "@/messages/ar/emails.json";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const BRAND = "#0532a3";
const MESSAGES = { en, ar } as const;

export interface WeeklyDigestEmailInput {
  locale: Locale;
  dealership: string;
  slug: string;
  /** Saturday 00:00 and the following Saturday 00:00, Cairo. */
  week: { start: Date; end: Date };
  numbers: WeeklyActivity & { aiListingsUsed: number; aiListingsLimit: number | null };
  /** The model's words; absent when it failed or quoted a number it should not have. */
  summary: WeeklySummary | null;
}

/**
 * A dealership's weekly summary email, in its chosen language and direction.
 * The figures are always there; the paragraph above them only when the model
 * wrote one that holds (see numbersHold). Inline styles only — email clients
 * ignore stylesheets.
 */
export function buildWeeklyDigestEmail(input: WeeklyDigestEmailInput): { subject: string; html: string } {
  const { locale, numbers: n } = input;
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "weeklyDigest" });
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const intl = locale === "ar" ? "ar-EG" : "en-GB";
  const num = (value: number) => new Intl.NumberFormat(intl).format(value);
  const day = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "Africa/Cairo" });
  // The range ends on the Friday: one day before the exclusive end.
  const lastDay = new Date(input.week.end.getTime() - 1);

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;color:#475569;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;text-align:${locale === "ar" ? "left" : "right"};font-weight:600;font-size:15px;color:#0f172a;">${escapeHtml(value)}</td>
    </tr>`;
  const section = (title: string, rows: string) => `
    <h3 style="margin:24px 0 4px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:${BRAND};">${escapeHtml(title)}</h3>
    <table role="presentation" width="100%" style="border-collapse:collapse;">${rows}</table>`;

  const ai =
    n.aiListingsLimit === null
      ? null
      : n.aiListingsLimit < 0
        ? t("aiUnlimited", { used: num(n.aiListingsUsed) })
        : t("aiOf", { used: num(n.aiListingsUsed), limit: num(n.aiListingsLimit) });

  const summary = input.summary
    ? `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#0f172a;">${escapeHtml(input.summary.summary)}</p>
    <p style="margin:0;padding:12px 14px;border-radius:8px;background:#eef2ff;font-size:14px;line-height:1.6;color:#1e293b;">
      <strong style="color:${BRAND};">${escapeHtml(t("tipLabel"))}:</strong> ${escapeHtml(input.summary.tip)}
    </p>`
    : "";

  const dashboard = `${APP_URL}/${locale}/org/${encodeURIComponent(input.slug)}/dashboard`;
  const settings = `${APP_URL}/${locale}/org/${encodeURIComponent(input.slug)}/settings/weekly-summary`;

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div dir="${dir}" style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:${locale === "ar" ? "Tahoma,Arial" : "Arial,Helvetica"},sans-serif;text-align:${align};">
    <div style="background:#ffffff;border-radius:12px;padding:28px 24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${escapeHtml(t("range", { start: day.format(input.week.start), end: day.format(lastDay) }))}</p>
      <h1 style="margin:0 0 20px;font-size:22px;color:#0f172a;">${escapeHtml(t("heading", { dealership: input.dealership }))}</h1>
      ${summary}
      ${section(
        t("sections.buyers"),
        row(t("rows.testDriveRequests"), num(n.testDriveRequests)) +
          row(t("rows.testDrivesPending"), num(n.testDrivesPending)) +
          row(t("rows.assistantAnswers"), num(n.assistantAnswers)) +
          row(t("rows.ratings"), t("ratingsValue", { helpful: num(n.answersHelpful), unhelpful: num(n.answersUnhelpful) })) +
          row(t("rows.questionsNew"), num(n.questionsNew)) +
          row(t("rows.questionsOpen"), num(n.questionsOpen))
      )}
      ${section(t("sections.stock"), row(t("rows.carsListed"), num(n.carsListed)) + row(t("rows.carsAvailable"), num(n.carsAvailable)))}
      ${ai ? section(t("sections.ai"), row(t("rows.aiListings"), ai)) : ""}
      <p style="margin:28px 0 0;text-align:center;">
        <a href="${dashboard}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(t("cta"))}</a>
      </p>
    </div>
    <p style="margin:16px 8px 0;font-size:12px;line-height:1.6;color:#64748b;">
      <a href="${settings}" style="color:#64748b;">${escapeHtml(t("footer"))}</a>
    </p>
  </div>
</body>
</html>`;

  return { subject: t("subject", { dealership: input.dealership }), html };
}
