"use client";

import { useTranslations } from "next-intl";
import { Building2, Download, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { dealershipQueryString } from "@/lib/services/super-admin/dealerships-options";
import type { DealershipRow, DealershipsPage } from "@/lib/services/super-admin/dealerships";
import { Pager } from "../../_components/Pager";
import DeleteOrganizationDialog from "./DeleteOrganizationDialog";
import ImpersonateModal from "./ImpersonateModal";
import { DealershipRowMenu } from "./DealershipRowMenu";
import { DealershipsToolbar } from "./DealershipsToolbar";
import { STATUS_TONES, downloadCsv } from "./use-dealership-display";
import { useDealershipsList } from "./use-dealerships-list";

const BASE = "/super-admin/organizations";

function Initials({ name, muted }: { name: string; muted?: boolean }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      dir="auto"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-[10px] text-caption font-extrabold",
        muted ? "bg-muted text-muted-foreground" : "bg-[#e7eef8] text-[#1d4e9e]",
      )}
    >
      {letters}
    </span>
  );
}

export function DealershipsList({ data }: { data: DealershipsPage }) {
  const t = useTranslations("superAdmin.organizations");
  const fmt = useFormatters();
  const n = (value: number) => fmt.number(value);
  const {
    query,
    rows,
    display,
    pending,
    startTransition,
    selected,
    setSelected,
    busy,
    exporting,
    impersonating,
    setImpersonating,
    deleting,
    setDeleting,
    suspending,
    setSuspending,
    chosen,
    allChosen,
    toggle,
    setStatus,
    requestStatus,
    confirmDelete,
    exportAll,
    filename,
    from,
    to,
    pageHref,
  } = useDealershipsList(data);

  const status = (row: DealershipRow) => {
    const { tone, label } = display.status(row);
    return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold", STATUS_TONES[tone])}>{label}</span>;
  };
  const menu = (row: DealershipRow) => (
    <DealershipRowMenu
      row={row}
      busy={busy !== null}
      onImpersonate={setImpersonating}
      onToggleStatus={(target) => requestStatus([target], !target.isActive)}
      onDelete={setDeleting}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline-strong" size="control" className="h-11 bg-field" onClick={exportAll} disabled={exporting || data.total === 0}>
              <Download aria-hidden className="size-4" />
              {exporting ? t("exporting") : t("export")}
            </Button>
            <Link href={`${BASE}/create`} className={cn(buttonVariants({ variant: "marker", size: "control" }), "h-11")}>
              <Plus aria-hidden className="size-[18px]" />
              {t("create")}
            </Link>
          </>
        }
        className="mb-0 md:mb-0"
      />

      <DealershipsToolbar key={dealershipQueryString({ ...query, page: 1 })} query={query} counts={data.counts} startTransition={startTransition} />

      <section
        aria-label={t("title")}
        aria-busy={pending}
        className={cn("overflow-hidden rounded-[20px] border border-border bg-card transition-opacity", pending && "opacity-60")}
      >
        {chosen.length > 0 && (
          <div role="status" className="flex flex-wrap items-center gap-2 bg-inverse px-4 py-2.5 text-caption text-inverse-foreground sm:px-5">
            <b className="me-2 font-semibold">{t("bulk.selected", { count: chosen.length, value: n(chosen.length) })}</b>
            {chosen.some((row) => row.isActive) && (
              <Button size="sm" variant="inverse" className="h-9 border border-inverse-foreground/25" disabled={busy !== null} onClick={() => requestStatus(chosen, false)}>
                {t("bulk.suspend")}
              </Button>
            )}
            {chosen.some((row) => !row.isActive) && (
              <Button size="sm" variant="inverse" className="h-9 border border-inverse-foreground/25" disabled={busy !== null} onClick={() => requestStatus(chosen, true)}>
                {t("bulk.activate")}
              </Button>
            )}
            <Button size="sm" variant="inverse" className="h-9 border border-inverse-foreground/25" onClick={() => downloadCsv(display.csv(chosen), filename())}>
              {t("bulk.export")}
            </Button>
            <Button size="sm" variant="inverse" className="ms-auto h-9" onClick={() => setSelected(new Set())}>
              {t("bulk.clear")}
            </Button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Building2 aria-hidden className="size-8 text-muted-foreground" />
            <p className="text-body font-semibold">{t("empty")}</p>
            <p className="text-caption text-muted-foreground">{t("emptyHint")}</p>
          </div>
        ) : (
          <>
            {/* The table from md, by column priority rather than one forced
                width: it was min-w-[960px] from 768px, so a tablet scrolled
                the last columns — the actions menu among them — out of view.
                Team and test drives join from lg, the join date from xl. */}
            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={t("columns.selectAll")}
                        checked={allChosen}
                        ref={(el) => {
                          if (el) el.indeterminate = chosen.length > 0 && !allChosen;
                        }}
                        onChange={() => setSelected(allChosen ? new Set() : new Set(rows.map((row) => row.id)))}
                        className="size-[18px] cursor-pointer accent-[#1d4e9e]"
                      />
                    </th>
                    <th scope="col" className="px-3 py-3 text-start font-semibold">{t("columns.dealership")}</th>
                    <th scope="col" className="px-3 py-3 text-center font-semibold">{t("columns.plan")}</th>
                    <th scope="col" className="px-3 py-3 text-center font-semibold">{t("columns.status")}</th>
                    <th scope="col" className="px-3 py-3 text-center font-semibold">{t("columns.cars")}</th>
                    <th scope="col" className="hidden px-3 py-3 text-center font-semibold lg:table-cell">{t("columns.team")}</th>
                    <th scope="col" className="hidden px-3 py-3 text-center font-semibold lg:table-cell">{t("columns.drives")}</th>
                    <th scope="col" className="px-3 py-3 text-center font-semibold">{t("columns.paid")}</th>
                    <th scope="col" className="hidden px-3 py-3 text-center font-semibold xl:table-cell">{t("columns.joined")}</th>
                    <th scope="col" className="w-14 px-3 py-3">
                      <span className="sr-only">{t("columns.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const on = selected.has(row.id);
                    const place = display.place(row);
                    const paid = display.paid(row);
                    return (
                      <tr key={row.id} className={cn("border-b border-border last:border-b-0", on && "bg-[#eef3fa]")}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={t("columns.selectRow", { name: row.name })}
                            checked={on}
                            onChange={() => toggle(row.id)}
                            className="size-[18px] cursor-pointer accent-[#1d4e9e]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Initials name={row.name} muted={!row.isActive} />
                            <div className="min-w-0">
                              <Link
                                href={`${BASE}/${row.id}`}
                                className="font-semibold text-foreground underline-offset-2 hover:text-[#1d4e9e] hover:underline"
                              >
                                <bdi>{row.name}</bdi>
                              </Link>
                              {place && <p className="text-micro text-muted-foreground">{place}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">{display.plan(row)}</td>
                        <td className="px-3 py-3 text-center">{status(row)}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{n(row.cars)}</td>
                        <td className="hidden px-3 py-3 text-center tabular-nums lg:table-cell">{n(row.team)}</td>
                        <td className="hidden px-3 py-3 text-center tabular-nums lg:table-cell">{n(row.recentDrives)}</td>
                        <td className={cn("px-3 py-3 text-center tabular-nums", !paid && "text-muted-foreground")}>
                          {paid ?? (row.plan && row.plan.type !== "STARTER" ? t("paidNone") : t("freePlan"))}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-3 text-center text-muted-foreground xl:table-cell">{display.day(row.createdAt)}</td>
                        <td className="px-3 py-2 text-end">{menu(row)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <Initials name={row.name} muted={!row.isActive} />
                  <Link href={`${BASE}/${row.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      <bdi>{row.name}</bdi>
                    </span>
                    <span className="block text-micro text-muted-foreground">
                      {display.plan(row)}
                      {fmt.locale === "ar" ? "، " : ", "}
                      {t("columns.cars")}: {n(row.cars)}
                    </span>
                    <span className="mt-1 block">{status(row)}</span>
                  </Link>
                  {menu(row)}
                </li>
              ))}
            </ul>
          </>
        )}

        {data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-5">
            <span>{t("pagination.showing", { from: n(from), to: n(to), total: n(data.total) })}</span>
            <Pager page={query.page} pages={data.pages} href={pageHref} scroll linkClassName="text-foreground" />
          </div>
        )}
      </section>

      {impersonating && <ImpersonateModal organization={impersonating} onClose={() => setImpersonating(null)} />}
      <AlertDialog open={suspending !== null} onOpenChange={(open) => !open && setSuspending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspending?.length === 1
                ? t("suspendDialog.title", { name: suspending[0].name })
                : t("suspendDialog.titleMany", { count: suspending?.length ?? 0, value: n(suspending?.length ?? 0) })}
            </AlertDialogTitle>
            <AlertDialogDescription>{suspending?.length === 1 ? t("suspendDialog.body") : t("suspendDialog.bodyMany")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {suspending?.length === 1 ? t("suspendDialog.keep") : t("suspendDialog.keepMany")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const targets = suspending ?? [];
                setSuspending(null);
                setStatus(targets, false);
              }}
            >
              {t("suspendDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteOrganizationDialog
        open={deleting !== null}
        org={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        isDeleting={busy === `delete-${deleting?.id}`}
      />
    </div>
  );
}
