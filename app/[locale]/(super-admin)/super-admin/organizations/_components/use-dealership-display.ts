"use client";

import { useTranslations } from "next-intl";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { findCity, findGovernorate } from "@/lib/locations/data";
import { formatPlanAmount } from "@/lib/utils/currency";
import type { DealershipRow } from "@/lib/services/super-admin/dealerships";

export type StatusTone = "ok" | "due" | "trial" | "off";

export const STATUS_TONES: Record<StatusTone, string> = {
  ok: "bg-positive-soft text-positive",
  due: "bg-destructive-soft text-destructive",
  trial: "bg-[#fff1c2] text-[#7a5200]",
  off: "bg-muted text-muted-foreground",
};

/**
 * How a dealership row reads, shared by the table, the phone list and the
 * CSV: its place, its plan, where it stands and what it has paid — each as
 * words in the reader's language.
 */
export function useDealershipDisplay() {
  const t = useTranslations("superAdmin.organizations");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const day = (iso: string) => fmt.date(iso, { year: undefined });

  const place = (row: DealershipRow) => {
    const name = (entry: { en: string; ar: string } | undefined) => (entry ? (fmt.locale === "ar" ? entry.ar : entry.en) : null);
    const city = name(findCity(row.city));
    const governorate = name(findGovernorate(row.region));
    return [city, governorate].filter((part, i, all) => part && all.indexOf(part) === i).join(fmt.locale === "ar" ? "، " : ", ");
  };

  const plan = (row: DealershipRow) => {
    const key = row.plan ? planKeyFor(row.plan.type) : planKeyFor("STARTER");
    return key ? tPlans(`plans.${key}.name`) : (row.plan?.name ?? "");
  };

  /** Suspension first; otherwise what the subscription says. No subscription means the free plan, in good standing. */
  const status = (row: DealershipRow): { tone: StatusTone; label: string } => {
    if (!row.isActive) return { tone: "off", label: t("status.suspended") };
    const sub = row.subscription;
    if (sub?.status === "PAST_DUE") {
      return { tone: "due", label: sub.pastDueSince ? t("status.overdue", { date: day(sub.pastDueSince) }) : t("views.overdue") };
    }
    if (sub?.status === "TRIALING") {
      return { tone: "trial", label: sub.periodEnd ? t("status.trial", { date: day(sub.periodEnd) }) : t("views.trial") };
    }
    if (sub?.status === "CANCELED") return { tone: "off", label: t("status.canceled") };
    if (sub?.status === "PENDING") return { tone: "trial", label: t("status.pending") };
    return { tone: "ok", label: t("status.active") };
  };

  const paid = (row: DealershipRow) => (row.paidCents > 0 ? formatPlanAmount(row.paidCents, fmt.locale) : null);

  /** The rows as a CSV: headers in the reader's language, plain digits so a spreadsheet can sum them, a BOM for Excel's Arabic. */
  const csv = (rows: DealershipRow[]) => {
    const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [
      t("columns.dealership"),
      t("csv.slug"),
      t("csv.email"),
      t("csv.phone"),
      t("filters.region"),
      t("columns.plan"),
      t("columns.status"),
      t("columns.cars"),
      t("columns.team"),
      t("columns.drives"),
      t("columns.paid"),
      t("columns.joined"),
    ];
    const lines = rows.map((row) =>
      [
        row.name,
        row.slug,
        row.email ?? "",
        row.phone ?? "",
        place(row),
        plan(row),
        status(row).label,
        row.cars,
        row.team,
        row.recentDrives,
        row.paidCents / 100,
        row.createdAt.slice(0, 10),
      ]
        .map(cell)
        .join(","),
    );
    return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  };

  return { place, plan, status, paid, csv, day };
}

/** Saves a CSV in the browser. */
export function downloadCsv(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
