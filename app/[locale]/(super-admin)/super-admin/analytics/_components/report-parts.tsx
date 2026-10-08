"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { changeFrom } from "@/lib/services/super-admin/analytics-options";
import type { Pair } from "@/lib/services/super-admin/analytics";

/**
 * The pieces every Analytics report is built from: a titled panel, a number
 * with how it moved since the period before, and a list of labelled bars.
 */

export function Panel({ title, note, children, className }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card", className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border px-5 py-3.5">
        <h2 className="text-body font-semibold">{title}</h2>
        {note && <span className="text-micro text-muted-foreground">{note}</span>}
      </header>
      {children}
    </section>
  );
}

/**
 * How a count moved since the period before. `better` says which way is good
 * news, so a rise in cancellations does not read as a win.
 */
export function Change({ pair, better = "up" }: { pair: Pair; better?: "up" | "down" }) {
  const t = useTranslations("superAdmin.analytics.change");
  const fmt = useFormatters();
  const change = changeFrom(pair.previous, pair.current);
  if (change === null) return <span className="text-micro text-muted-foreground">{pair.current > 0 ? t("new") : t("same")}</span>;
  if (Math.abs(change) < 0.005) return <span className="text-micro text-muted-foreground">{t("same")}</span>;
  const up = change > 0;
  const good = up === (better === "up");
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
      <Icon aria-hidden className={cn("size-3.5 shrink-0 rtl:-scale-x-100", good ? "text-[#0e6b4c]" : "text-[#a3341f]")} />
      {t(up ? "up" : "down", { value: fmt.number(Math.abs(change), { style: "percent", maximumFractionDigits: 0 }) })}
    </span>
  );
}

/** A headline number with its label and a line beneath. */
export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[20px] border border-border bg-card px-5 py-4">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-[1.75rem] font-bold leading-tight tracking-tight tabular-nums">{value}</span>
      {note && <span className="min-h-5">{note}</span>}
    </div>
  );
}

/** Labelled bars, each with its value written beside it; the longest fills the track. */
export function Bars({ rows, empty }: { rows: { key: string; label: ReactNode; value: number; shown?: ReactNode }[]; empty: string }) {
  const fmt = useFormatters();
  const max = Math.max(0, ...rows.map((row) => row.value));
  if (max === 0) return <p className="px-5 py-8 text-center text-caption text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1 py-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(0,9rem)_1fr_4rem] items-center gap-3 px-5 py-1.5 text-caption">
          <span className="truncate">{row.label}</span>
          <span aria-hidden className="h-2.5 rounded-e bg-muted">
            <span className="block h-full rounded-e bg-[#1d4e9e]" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
          </span>
          <span className="text-end font-semibold tabular-nums">{row.shown ?? fmt.number(row.value)}</span>
        </li>
      ))}
    </ul>
  );
}
