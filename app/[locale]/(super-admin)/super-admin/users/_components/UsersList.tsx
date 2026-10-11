"use client";

import { useTranslations } from "next-intl";
import { Download, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { USERS_PER_PAGE, userQueryString } from "@/lib/services/super-admin/users-options";
import type { UserRow, UsersPage } from "@/lib/services/super-admin/users";
import ImpersonateModal from "../../organizations/_components/ImpersonateModal";
import { KIND_TONES } from "./use-user-display";
import { UsersToolbar } from "./UsersToolbar";
import { UserRowMenu } from "./UserRowMenu";
import { useUsersList } from "./use-users-list";
import { Pager } from "../../_components/Pager";

const BASE = "/super-admin/users";
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
  const fmt = useFormatters();
  const n = (value: number) => fmt.number(value);
  const {
    query,
    rows,
    display,
    pending,
    startTransition,
    exporting,
    changing,
    setChanging,
    saving,
    impersonating,
    setImpersonating,
    exportAll,
    changeRole,
  } = useUsersList(data);

  const menu = (row: UserRow) => (
    <UserRowMenu row={row} currentAdminId={currentAdminId} onImpersonate={setImpersonating} onChangeRole={setChanging} />
  );

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
            <Pager page={query.page} pages={data.pages} href={pageHref} scroll linkClassName="text-foreground" />
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
