"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Download, Eye, MoreHorizontal, ShieldCheck, ShieldOff, UserCog, Users } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { exportUsers, updateUserRole } from "@/actions/super-admin";
import { USERS_PER_PAGE, userQueryString } from "@/lib/services/super-admin/users-options";
import type { UserRow, UsersPage } from "@/lib/services/super-admin/users";
import ImpersonateModal from "../../organizations/_components/ImpersonateModal";
import { downloadCsv } from "../../organizations/_components/use-dealership-display";
import { KIND_TONES, useUserDisplay } from "./use-user-display";
import { UsersToolbar } from "./UsersToolbar";

const BASE = "/super-admin/users";
const pagerLink =
  "flex size-10 items-center justify-center rounded-control border border-border bg-field text-caption font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const th = "px-3 py-3 text-center font-semibold first:ps-5 first:text-start";
const td = "px-3 py-3 text-center first:ps-5 first:text-start";

/**
 * The super-admin users list (canvas: Super admin users round 1, "1 · Data
 * table"): search, the kind of account (with how many of each), a dealership
 * filter and a sort, then a table — ten to a page, a list of cards below
 * laptop width — with a menu per person: open them, start a support session
 * as them, or give or take platform admin access, which asks first.
 */
export function UsersList({ data, currentAdminId }: { data: UsersPage; currentAdminId: string }) {
  const t = useTranslations("superAdmin.users");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const fmt = useFormatters();
  const display = useUserDisplay();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [changing, setChanging] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState<UserRow | null>(null);
  const { query, rows } = data;
  const n = (value: number) => fmt.number(value);

  const exportAll = async () => {
    setExporting(true);
    try {
      const result = await exportUsers(Object.fromEntries(new URLSearchParams(userQueryString(query))));
      if (result.success && result.data) downloadCsv(display.csv(result.data), `autome-users-${new Date().toISOString().slice(0, 10)}.csv`);
      else toast.error(t("exportFailed"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const changeRole = async () => {
    if (!changing) return;
    const makingAdmin = changing.role !== "ADMIN";
    setSaving(true);
    try {
      const result = await updateUserRole(changing.id, makingAdmin ? "ADMIN" : "USER");
      if (result.success) {
        toast.success(t(makingAdmin ? "roleDialog.made" : "roleDialog.removed", { name: display.name(changing) }));
        startTransition(() => router.refresh());
      } else {
        toast.error(t("roleDialog.failed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
      setChanging(null);
    }
  };

  const menu = (row: UserRow) => {
    const team = row.memberships[0]?.organization;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("actionsFor", { name: display.name(row) })}
          className="flex size-10 items-center justify-center rounded-control text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal aria-hidden className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-control p-1.5">
          <DropdownMenuItem asChild className="h-10 gap-2.5">
            <Link href={`${BASE}/${row.id}`}>
              <Eye aria-hidden className="size-4" />
              {t("actions.open")}
            </Link>
          </DropdownMenuItem>
          {team && (
            <DropdownMenuItem className="h-10 gap-2.5" onSelect={() => setImpersonating(row)}>
              <UserCog aria-hidden className="size-4" />
              {t("actions.impersonate")}
            </DropdownMenuItem>
          )}
          {row.id !== currentAdminId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={cn("h-10 gap-2.5", row.role === "ADMIN" && "text-destructive focus:text-destructive")} onSelect={() => setChanging(row)}>
                {row.role === "ADMIN" ? <ShieldOff aria-hidden className="size-4" /> : <ShieldCheck aria-hidden className="size-4" />}
                {row.role === "ADMIN" ? t("actions.removeAdmin") : t("actions.makeAdmin")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const avatar = (row: UserRow) => (
    <span
      aria-hidden
      dir="auto"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-micro font-extrabold",
        row.role === "ADMIN" ? "bg-inverse text-inverse-foreground" : "bg-[#e7eef8] text-[#1d4e9e]",
      )}
    >
      {display.initials(row)}
    </span>
  );
  const kind = (row: UserRow) => {
    const k = display.kind(row);
    return <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold", KIND_TONES[k])}>{t(`kinds.${k}`)}</span>;
  };
  const dealership = (row: UserRow) => {
    const d = display.dealership(row);
    if (!d) return <span className="text-muted-foreground">—</span>;
    return (
      <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
        <Link href={`/super-admin/organizations/${d.organization.id}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
          <bdi>{d.organization.name}</bdi>
        </Link>
        {d.more && <span className="text-micro text-muted-foreground">{d.more}</span>}
      </span>
    );
  };

  const from = data.total === 0 ? 0 : (query.page - 1) * USERS_PER_PAGE + 1;
  const to = Math.min(query.page * USERS_PER_PAGE, data.total);
  const pageHref = (page: number) => `${BASE}${userQueryString({ ...query, page })}`;
  const pages = Array.from({ length: data.pages }, (_, i) => i + 1).filter(
    (page) => data.pages <= 7 || page === 1 || page === data.pages || Math.abs(page - query.page) <= 1,
  );
  const makingAdmin = changing?.role !== "ADMIN";

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline-strong" size="control" className="h-11 bg-field" onClick={exportAll} disabled={exporting || data.total === 0}>
            <Download aria-hidden className="size-4" />
            {exporting ? t("exporting") : t("export")}
          </Button>
        }
        className="mb-0 md:mb-0"
      />

      <UsersToolbar key={userQueryString({ ...query, page: 1 })} query={query} counts={data.counts} dealerships={data.dealerships} startTransition={startTransition} />

      <section aria-label={t("title")} aria-busy={pending} className={cn("overflow-hidden rounded-[20px] border border-border bg-card transition-opacity", pending && "opacity-60")}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Users aria-hidden className="size-8 text-muted-foreground" />
            <p className="text-body font-semibold">{t("empty")}</p>
            <p className="text-caption text-muted-foreground">{t("emptyHint")}</p>
          </div>
        ) : (
          <>
            {/* Phones and tablets: one card per person. */}
            <ul className="flex flex-col lg:hidden">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-2.5 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="flex items-center gap-3">
                    {avatar(row)}
                    <Link href={`${BASE}/${row.id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        <bdi>{display.name(row)}</bdi>
                      </span>
                      {display.contact(row) && (
                        <span className="block truncate text-micro text-muted-foreground" dir="ltr">
                          {display.contact(row)}
                        </span>
                      )}
                    </Link>
                    {menu(row)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-micro text-muted-foreground">
                    {kind(row)}
                    {display.dealership(row) && <span className="text-caption">{dealership(row)}</span>}
                    {display.kind(row) === "buyer" && (
                      <>
                        <span>
                          {t("columns.savedCars")}: <b className="font-semibold text-foreground tabular-nums">{n(row.savedCars)}</b>
                        </span>
                        <span>
                          {t("columns.testDrives")}: <b className="font-semibold text-foreground tabular-nums">{n(row.testDrives)}</b>
                        </span>
                      </>
                    )}
                    <span>{display.day(row.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>{t("columns.person")}</th>
                    <th scope="col" className={th}>{t("columns.account")}</th>
                    <th scope="col" className={th}>{t("columns.dealership")}</th>
                    <th scope="col" className={th}>{t("columns.savedCars")}</th>
                    <th scope="col" className={th}>{t("columns.testDrives")}</th>
                    <th scope="col" className={th}>{t("columns.joined")}</th>
                    <th scope="col" className="w-14 px-3 py-3">
                      <span className="sr-only">{t("columns.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-b-0">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          {avatar(row)}
                          <div className="min-w-0">
                            <Link href={`${BASE}/${row.id}`} className="font-semibold text-foreground underline-offset-2 hover:text-[#1d4e9e] hover:underline">
                              <bdi>{display.name(row)}</bdi>
                            </Link>
                            {display.contact(row) && (
                              <p className="text-micro text-muted-foreground" dir="ltr">
                                {display.contact(row)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={td}>{kind(row)}</td>
                      <td className={td}>{dealership(row)}</td>
                      {/* Saved cars and test drives are a buyer's; staff and admins show a dash. */}
                      {display.kind(row) === "buyer" ? (
                        <>
                          <td className={cn(td, "tabular-nums")}>{n(row.savedCars)}</td>
                          <td className={cn(td, "tabular-nums")}>{n(row.testDrives)}</td>
                        </>
                      ) : (
                        <>
                          <td className={cn(td, "text-muted-foreground")} aria-label={t("notBuyer")}>
                            <span aria-hidden>—</span>
                          </td>
                          <td className={cn(td, "text-muted-foreground")} aria-label={t("notBuyer")}>
                            <span aria-hidden>—</span>
                          </td>
                        </>
                      )}
                      <td className={cn(td, "whitespace-nowrap text-muted-foreground")}>{display.day(row.createdAt)}</td>
                      <td className="px-3 py-2 text-end">{menu(row)}</td>
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
            {data.pages > 1 && (
              <nav aria-label={t("pagination.label")} className="flex items-center gap-1.5">
                <Link
                  href={pageHref(Math.max(1, query.page - 1))}
                  aria-label={t("pagination.previous")}
                  aria-disabled={query.page === 1}
                  className={cn(pagerLink, query.page === 1 && "pointer-events-none opacity-40")}
                >
                  <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
                </Link>
                {pages.map((page, i) => (
                  <span key={page} className="flex items-center gap-1.5">
                    {i > 0 && page - pages[i - 1] > 1 && <span aria-hidden>…</span>}
                    <Link href={pageHref(page)} aria-current={page === query.page ? "page" : undefined} className={cn(pagerLink, page === query.page && "border-inverse bg-inverse text-inverse-foreground")}>
                      {n(page)}
                    </Link>
                  </span>
                ))}
                <Link
                  href={pageHref(Math.min(data.pages, query.page + 1))}
                  aria-label={t("pagination.next")}
                  aria-disabled={query.page === data.pages}
                  className={cn(pagerLink, query.page === data.pages && "pointer-events-none opacity-40")}
                >
                  <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
                </Link>
              </nav>
            )}
          </div>
        )}
      </section>

      {impersonating?.memberships[0] && (
        <ImpersonateModal organization={impersonating.memberships[0].organization} userId={impersonating.id} onClose={() => setImpersonating(null)} />
      )}

      <AlertDialog open={changing !== null} onOpenChange={(open) => !open && !saving && setChanging(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {changing && t(makingAdmin ? "roleDialog.makeTitle" : "roleDialog.removeTitle", { name: display.name(changing) })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t(makingAdmin ? "roleDialog.makeBody" : "roleDialog.removeBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={saving}>
              {t("roleDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn("cursor-pointer", !makingAdmin && "bg-destructive text-white hover:bg-destructive/90")}
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                changeRole();
              }}
            >
              {saving ? t("roleDialog.saving") : t(makingAdmin ? "roleDialog.makeConfirm" : "roleDialog.removeConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
