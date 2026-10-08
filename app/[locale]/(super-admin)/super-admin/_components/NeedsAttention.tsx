"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { PlatformOverview } from "@/lib/services/super-admin/overview";

const TAGS = {
  overdue: "bg-destructive-soft text-destructive",
  trial: "bg-[#fff1c2] text-[#8a5e00]",
  support: "bg-[#e7eef8] text-[#1d4e9e]",
  new: "bg-muted text-muted-foreground",
} as const;

const NAMES_SHOWN = 3;

type Row = { key: string; tag: keyof typeof TAGS; dealership: string; details: string; href: string; action: string };

const actionLink = cn(buttonVariants({ variant: "outline-strong", size: "control" }), "h-10 shrink-0 border bg-field");

/**
 * What needs an admin, as a queue (canvas: Super admin overview round 2,
 * "3 · Metric explorer"): payments overdue, trials ending within a week,
 * support sessions left open, and new dealerships with no cars — each with
 * its dealership and the one action that deals with it. A table from md up,
 * a list of cards on a phone.
 */
export function NeedsAttention({ needsYou, currentAdminId }: { needsYou: PlatformOverview["needsYou"]; currentAdminId: string }) {
  const t = useTranslations("superAdmin.overview.needs");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const locale = useLocale();
  const day = (iso: string) => fmt.date(`${iso}T00:00:00Z`, { month: "long", timeZone: "UTC" });
  const planName = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  const newNames = needsYou.newWithoutCars.map((org) => org.name);
  const list = new Intl.ListFormat(locale, { type: "conjunction" });

  const rows: Row[] = [
    ...needsYou.pastDue.map((item) => ({
      key: `due-${item.organization.id}`,
      tag: "overdue" as const,
      dealership: item.organization.name,
      details: t("overdue", {
        plan: planName(item.plan),
        since: item.since ? fmt.date(item.since, { month: "long" }) : "",
        drops: item.dropsOn ? day(item.dropsOn) : "",
      }),
      href: `/super-admin/organizations/${item.organization.id}`,
      action: t("open"),
    })),
    ...needsYou.trialsEnding.map((item) => ({
      key: `trial-${item.organization.id}`,
      tag: "trial" as const,
      dealership: item.organization.name,
      details: t("trial", { plan: planName(item.plan), date: item.endsOn ? day(item.endsOn) : "" }),
      href: `/super-admin/organizations/${item.organization.id}`,
      action: t("open"),
    })),
    ...needsYou.sessions.map((session) => {
      const minutes = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000));
      const values = {
        admin: session.superAdmin.name || session.superAdmin.email || "",
        person: session.targetUser.name || session.targetUser.email || "",
        minutes,
        value: fmt.number(minutes),
      };
      return {
        key: `session-${session.id}`,
        tag: "support" as const,
        dealership: session.organization.name,
        details: session.superAdmin.id === currentAdminId ? t("sessionMine", values) : t("session", values),
        href: "/super-admin/impersonation",
        action: t("review"),
      };
    }),
    ...(newNames.length > 0
      ? [
          {
            key: "new",
            tag: "new" as const,
            dealership:
              newNames.length > NAMES_SHOWN
                ? t("more", { list: list.format(newNames.slice(0, NAMES_SHOWN)), value: fmt.number(newNames.length - NAMES_SHOWN) })
                : list.format(newNames),
            details: t("newWithoutCars"),
            href: "/super-admin/organizations",
            action: t("seeThem"),
          },
        ]
      : []),
  ];

  const tag = (row: Row) => (
    <span className={cn("w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold", TAGS[row.tag])}>{t(`tags.${row.tag}`)}</span>
  );

  return (
    <section aria-labelledby="needs-title" className="overflow-hidden rounded-[20px] border border-border bg-card">
      <header className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <h2 id="needs-title" className="text-[1.25rem] font-extrabold leading-tight">
          {t("title")}
        </h2>
        {rows.length > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-inverse px-2 text-micro font-bold text-inverse-foreground tabular-nums">
            {fmt.number(rows.length)}
          </span>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">{t("none")}</p>
      ) : (
        <>
          <table className="hidden w-full border-collapse text-caption md:table">
            <thead>
              <tr className="border-t border-border bg-muted/60 text-muted-foreground">
                <th scope="col" className="px-5 py-3 text-start font-semibold">{t("columns.issue")}</th>
                <th scope="col" className="px-3 py-3 text-start font-semibold">{t("columns.dealership")}</th>
                <th scope="col" className="px-3 py-3 text-start font-semibold">{t("columns.details")}</th>
                <th scope="col" className="px-5 py-3 text-end font-semibold">
                  <span className="sr-only">{t("columns.action")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="px-5 py-3">{tag(row)}</td>
                  <td className="px-3 py-3 font-semibold">
                    <bdi>{row.dealership}</bdi>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{row.details}</td>
                  <td className="px-5 py-3 text-end">
                    <Link href={row.href} className={actionLink}>
                      {row.action}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col md:hidden">
            {rows.map((row) => (
              <li key={row.key} className="flex flex-col gap-2 border-t border-border px-4 py-3">
                {tag(row)}
                <p className="text-caption text-muted-foreground">
                  <bdi className="font-semibold text-foreground">{row.dealership}</bdi> {row.details}
                </p>
                <Link href={row.href} className={cn(actionLink, "w-full")}>
                  {row.action}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
