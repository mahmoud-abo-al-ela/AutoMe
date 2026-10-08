"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Headset, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { inputClass } from "@/components/dashboard/form-ui";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { endImpersonation } from "@/actions/super-admin";
import { SESSIONS_PER_PAGE, SESSION_VIEWS, sessionQueryString } from "@/lib/services/super-admin/sessions-options";
import type { SessionRow, SessionsPage } from "@/lib/services/super-admin/sessions";
import ImpersonateModal from "../../organizations/_components/ImpersonateModal";
import { Pager } from "../../organizations/[id]/_components/RecordTabs";
import { SessionsToolbar } from "./SessionsToolbar";

const BASE = "/super-admin/impersonation";
const th = "px-3 py-3 text-center font-semibold first:ps-5 first:text-start";
const td = "px-3 py-3 text-center first:ps-5 first:text-start";

/**
 * The super-admin support sessions list (canvas: Super admin support sessions
 * round 1, "1 · Data table"): views with their counts — open now among them —
 * search, an admin filter and a period, then one row per session: who signed
 * in as whom, where, why, for how long, and how many changes they made. An
 * open session can be ended (it asks first); a finished one links to what
 * changed. Ten to a page; cards below laptop width.
 */
export function SessionsList({ data, currentAdminId }: { data: SessionsPage; currentAdminId: string }) {
  const t = useTranslations("superAdmin.impersonation");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const fmt = useFormatters();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ending, setEnding] = useState<SessionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [dealership, setDealership] = useState("");
  const [starting, setStarting] = useState<{ id: string; name: string; slug: string } | null>(null);
  const { query, rows } = data;
  const n = (value: number) => fmt.number(value);
  const now = Date.parse(data.now);

  const person = (user: { id: string; name: string | null; email: string | null }) => user.name || user.email || "";
  const admin = (row: SessionRow) => (row.superAdmin.id === currentAdminId ? t("you") : person(row.superAdmin));
  const length = (row: SessionRow) => {
    const minutes = Math.max(1, Math.round(((row.endedAt ? Date.parse(row.endedAt) : now) - Date.parse(row.startedAt)) / 60000));
    const text = minutes >= 60 ? t("hours", { hours: n(Math.floor(minutes / 60)), minutes: n(minutes % 60) }) : t("minutes", { value: n(minutes) });
    return row.endedAt ? (
      text
    ) : (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-[#7a5200]">
        <span aria-hidden className="size-2 rounded-full bg-[#e0a400]" />
        {t("open", { length: text })}
      </span>
    );
  };
  const action = (row: SessionRow, full = false) =>
    row.endedAt ? (
      <Link
        href={`/super-admin/organizations/${row.organization.id}?tab=activity`}
        aria-label={t("viewFor", { dealership: row.organization.name })}
        className={cn(
          "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-control border-2 border-border-strong bg-field px-3 text-caption font-semibold hover:bg-muted",
          full && "h-10 w-full",
        )}
      >
        {t("view")}
      </Link>
    ) : (
      <Button
        variant="outline-strong"
        size="sm"
        className={cn("h-9 border-destructive/60 bg-field text-destructive hover:bg-destructive-soft", full && "h-10 w-full")}
        aria-label={t("endFor", { dealership: row.organization.name })}
        onClick={() => setEnding(row)}
      >
        {t("end")}
      </Button>
    );
  const personLink = (user: { id: string; name: string | null; email: string | null }) => (
    <Link href={`/super-admin/users/${user.id}`} className="underline-offset-2 hover:text-[#1d4e9e] hover:underline">
      <bdi>{person(user)}</bdi>
    </Link>
  );
  const dealershipLink = (org: { id: string; name: string }) => (
    <Link href={`/super-admin/organizations/${org.id}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
      <bdi>{org.name}</bdi>
    </Link>
  );

  const end = async () => {
    if (!ending) return;
    setBusy(true);
    try {
      const result = await endImpersonation(ending.id);
      if (result.success) {
        toast.success(t("endDialog.ended"));
        startTransition(() => router.refresh());
      } else {
        toast.error(t("endDialog.failed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(t("endDialog.failed"));
    } finally {
      setBusy(false);
      setEnding(null);
    }
  };

  const from = data.total === 0 ? 0 : (query.page - 1) * SESSIONS_PER_PAGE + 1;
  const to = Math.min(query.page * SESSIONS_PER_PAGE, data.total);

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="marker" size="control" className="h-11" onClick={() => setPicking(true)}>
            <UserCog aria-hidden className="size-[18px]" />
            {t("start")}
          </Button>
        }
        className="mb-0 md:mb-0"
      />

      <nav aria-label={t("views.label")} className="-mx-4 -mb-1 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {SESSION_VIEWS.map((view) => {
          const on = view === query.view;
          return (
            <Link
              key={view}
              href={`${BASE}${sessionQueryString({ ...query, view, page: 1 })}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 px-3 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                on ? "font-semibold text-foreground shadow-[inset_0_-3px_0_var(--foreground)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`views.${view}`)}
              <span
                className={cn(
                  "rounded-full px-2 text-micro font-semibold leading-5 tabular-nums",
                  view === "open" && data.counts.open > 0 ? "bg-[#fff1c2] text-[#7a5200]" : "bg-muted text-foreground",
                )}
              >
                {n(data.counts[view])}
              </span>
            </Link>
          );
        })}
      </nav>

      <SessionsToolbar
        key={sessionQueryString({ ...query, page: 1 })}
        query={query}
        admins={data.admins}
        currentAdminId={currentAdminId}
        startTransition={startTransition}
      />

      <section aria-label={t("title")} aria-busy={pending} className={cn("overflow-hidden rounded-[20px] border border-border bg-card transition-opacity", pending && "opacity-60")}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Headset aria-hidden className="size-8 text-muted-foreground" />
            <p className="text-body font-semibold">{t("empty")}</p>
            <p className="text-caption text-muted-foreground">{t("emptyHint")}</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col lg:hidden">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-caption">
                      {dealershipLink(row.organization)}
                      <span className="block text-muted-foreground">
                        {admin(row)} <span aria-hidden>→</span> {personLink(row.targetUser)}
                      </span>
                    </p>
                    <span className="shrink-0 text-micro">{length(row)}</span>
                  </div>
                  <p className="text-micro text-muted-foreground">{row.reason}</p>
                  <div className="flex items-center justify-between gap-3 text-micro text-muted-foreground">
                    <span>{fmt.dateTime(row.startedAt, { year: undefined })}</span>
                    <span>
                      {t("columns.changes")}: <b className="font-semibold text-foreground tabular-nums">{n(row.changes)}</b>
                    </span>
                  </div>
                  {action(row, true)}
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>{t("columns.started")}</th>
                    <th scope="col" className={th}>{t("columns.by")}</th>
                    <th scope="col" className={th}>{t("columns.dealership")}</th>
                    <th scope="col" className={th}>{t("columns.signedInAs")}</th>
                    <th scope="col" className={cn(th, "text-start")}>{t("columns.reason")}</th>
                    <th scope="col" className={th}>{t("columns.length")}</th>
                    <th scope="col" className={th}>{t("columns.changes")}</th>
                    <th scope="col" className="w-32 px-3 py-3">
                      <span className="sr-only">{t("columns.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-b-0">
                      <td className={cn(td, "whitespace-nowrap text-muted-foreground")}>{fmt.dateTime(row.startedAt, { year: undefined })}</td>
                      <td className={cn(td, "font-semibold")}>
                        {row.superAdmin.id === currentAdminId ? t("you") : personLink(row.superAdmin)}
                      </td>
                      <td className={td}>{dealershipLink(row.organization)}</td>
                      <td className={td}>{personLink(row.targetUser)}</td>
                      <td className={cn(td, "max-w-[280px] text-start text-muted-foreground")}>{row.reason}</td>
                      <td className={cn(td, "whitespace-nowrap")}>{length(row)}</td>
                      <td className={cn(td, "tabular-nums")}>{n(row.changes)}</td>
                      <td className="px-3 py-2 text-end">{action(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-5">
            <span>{t("pagination.showing", { from: n(from), to: n(to), total: n(data.total) })}</span>
            <Pager page={query.page} pages={data.pages} href={(page) => `${BASE}${sessionQueryString({ ...query, page })}`} />
          </div>
        )}
      </section>

      {/* Ending asks first: it signs the admin out of the dealership's dashboard. */}
      <AlertDialog open={ending !== null} onOpenChange={(open) => !open && !busy && setEnding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("endDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {ending &&
                t("endDialog.body", { admin: admin(ending), person: person(ending.targetUser), dealership: ending.organization.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={busy}>
              {t("endDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                end();
              }}
            >
              {busy ? t("endDialog.ending") : t("endDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Starting one: choose the dealership here, then who and why in the usual dialog. */}
      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent className="rounded-[20px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("startDialog.title")}</DialogTitle>
            <DialogDescription>{t("startDialog.body")}</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-semibold">{t("startDialog.dealership")}</span>
            <SearchableLocationSelect
              value={dealership}
              options={data.dealerships.map((d) => ({ value: d.id, label: d.name }))}
              placeholder={t("startDialog.choose")}
              searchPlaceholder={t("startDialog.search")}
              emptyMessage={t("startDialog.none")}
              onValueChange={setDealership}
              triggerClassName={inputClass()}
            />
          </label>
          <DialogFooter>
            <Button
              variant="marker"
              size="control"
              className="h-11"
              disabled={!dealership}
              onClick={() => {
                const chosen = data.dealerships.find((d) => d.id === dealership);
                if (!chosen) return;
                setPicking(false);
                setStarting(chosen);
              }}
            >
              {t("startDialog.next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {starting && <ImpersonateModal organization={starting} onClose={() => setStarting(null)} />}
    </div>
  );
}
