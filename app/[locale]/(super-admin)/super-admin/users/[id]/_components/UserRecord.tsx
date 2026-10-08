"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { UserDetail } from "@/lib/services/super-admin/user-detail";
import { UserHeader } from "./UserHeader";
import { UserTabSkeleton } from "./TabSkeletons";
import { useTabSwitch } from "../../../_components/use-tab-switch";
import {
  ActivityFeed,
  DealershipsList,
  DrivesList,
  Pager,
  Panel,
  ReviewsList,
  SavedList,
  SessionsList,
} from "./UserTabs";

/**
 * One person (canvas: Super admin one user round 1, "A · Record with tabs"):
 * who they are and their actions, then tabs that follow the kind of account —
 * the summary's four numbers and lists change with it too. Tab and page are
 * in the URL.
 */
export function UserRecord({
  data,
  currentAdminId,
}: {
  data: UserDetail;
  currentAdminId: string;
}) {
  const t = useTranslations("superAdmin.users.details");
  const fmt = useFormatters();
  const n = (value: number) => fmt.number(value);
  const base = `/super-admin/users/${data.user.id}`;
  const href = (tab: string, page = 1) =>
    tab === "summary"
      ? base
      : `${base}?tab=${tab}${page > 1 ? `&page=${page}` : ""}`;
  const tabCount: Partial<Record<string, number>> = {
    dealerships: data.counts.dealerships,
    drives: data.counts.testDrives,
    saved: data.counts.savedCars,
    reviews: data.counts.reviews,
    sessions: data.counts.sessions,
  };
  const { counts, stats, kind } = data;
  const tabs = useTabSwitch(data.tab);

  const numbers =
    kind === "buyer"
      ? [
          {
            label: t("kpis.drives"),
            value: n(counts.testDrives),
            note: stats.upcoming
              ? t("kpis.upcoming", { value: n(stats.upcoming) })
              : t("kpis.noneUpcoming"),
          },
          {
            label: t("kpis.saved"),
            value: n(counts.savedCars),
            note: counts.savedCars
              ? t("kpis.savedAt", {
                  count: stats.savedDealerships,
                  value: n(stats.savedDealerships),
                })
              : null,
          },
          {
            label: t("kpis.reviews"),
            value: n(counts.reviews),
            note: stats.rating
              ? t("kpis.averageRating", {
                  rating: fmt.number(stats.rating, {
                    maximumFractionDigits: 1,
                  }),
                })
              : null,
          },
        ]
      : kind === "staff"
        ? [
            {
              label: t("kpis.dealerships"),
              value: n(counts.dealerships),
              note: null,
            },
            {
              label: t("kpis.carsAdded"),
              value: n(stats.carsAdded),
              note: null,
            },
            {
              label: t("kpis.changes"),
              value: n(stats.recentChanges),
              note: null,
            },
          ]
        : [
            {
              label: t("kpis.sessions"),
              value: n(counts.sessions),
              note: stats.openSessions
                ? t("kpis.openNow", { value: n(stats.openSessions) })
                : t("kpis.noneOpen"),
            },
            {
              label: t("kpis.changes"),
              value: n(stats.recentChanges),
              note: null,
            },
            {
              label: t("kpis.dealerships"),
              value: n(counts.dealerships),
              note: null,
            },
          ];
  const seeAll = (tab: (typeof data.tabs)[number]) => (
    <Link
      href={href(tab)}
      scroll={false}
      onClick={tabs.open(tab, href(tab))}
      className="text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
    >
      {t("seeAll")}
    </Link>
  );
  const pager = (page: number, pages: number, tab: string) =>
    pages > 1 && (
      <div className="flex justify-end border-t border-border px-4 py-3 sm:px-5">
        <Pager page={page} pages={pages} href={(p) => href(tab, p)} />
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <UserHeader data={data} currentAdminId={currentAdminId} />

      <nav
        aria-label={t("tabs.label")}
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {data.tabs.map((tab) => {
          const on = tab === tabs.shown;
          return (
            <Link
              key={tab}
              href={href(tab)}
              scroll={false}
              onClick={tabs.open(tab, href(tab))}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 px-3.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                on
                  ? "font-semibold text-foreground shadow-[inset_0_-3px_0_var(--foreground)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${tab}`)}
              {tabCount[tab] !== undefined && (
                <span className="rounded-full bg-muted px-2 text-micro font-semibold leading-5 text-foreground tabular-nums">
                  {n(tabCount[tab]!)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Switching tabs shows the next tab's own skeleton until it arrives. */}
      {tabs.loading ? (
        <UserTabSkeleton tab={tabs.shown} />
      ) : (
        <>
          {"summary" in data && (
            <div className="flex flex-col gap-6">
              <dl
                aria-label={t("kpis.label")}
                className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-border bg-card lg:grid-cols-3"
              >
                {numbers.map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex flex-col gap-0.5 border-border p-4 sm:px-5",
                      i % 2 === 1 && "border-s",
                      i >= 2 && "col-span-2 border-t lg:col-span-1",
                      "lg:border-t-0 lg:border-s lg:first:border-s-0",
                    )}
                  >
                    <dt className="text-caption text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-[1.6rem] font-extrabold leading-tight tabular-nums">
                      {item.value}
                    </dd>
                    {item.note && (
                      <dd className="text-micro text-muted-foreground">
                        {item.note}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>

              {kind === "buyer" && (
                <div className="grid items-start gap-6 xl:grid-cols-2">
                  <Panel
                    title={t("tabs.drives")}
                    action={counts.testDrives > 0 && seeAll("drives")}
                  >
                    <DrivesList drives={data.summary.drives} />
                  </Panel>
                  <Panel
                    title={t("tabs.saved")}
                    action={counts.savedCars > 0 && seeAll("saved")}
                  >
                    <SavedList saved={data.summary.saved} />
                  </Panel>
                </div>
              )}
              {kind === "staff" && (
                <div className="grid items-start gap-6 xl:grid-cols-2">
                  <Panel title={t("tabs.dealerships")}>
                    <DealershipsList dealerships={data.summary.dealerships} />
                  </Panel>
                  {data.summary.activity && (
                    <Panel
                      title={t("tabs.activity")}
                      action={
                        data.summary.activity.pagination.total > 0 &&
                        seeAll("activity")
                      }
                    >
                      <ActivityFeed activity={data.summary.activity} />
                    </Panel>
                  )}
                </div>
              )}
              {kind === "admin" && (
                <div className="grid items-start gap-6 xl:grid-cols-2">
                  <Panel
                    title={t("tabs.sessions")}
                    action={counts.sessions > 0 && seeAll("sessions")}
                  >
                    <SessionsList sessions={data.summary.sessions} />
                  </Panel>
                  {data.summary.activity && (
                    <Panel
                      title={t("tabs.activity")}
                      action={
                        data.summary.activity.pagination.total > 0 &&
                        seeAll("activity")
                      }
                    >
                      <ActivityFeed activity={data.summary.activity} />
                    </Panel>
                  )}
                </div>
              )}
            </div>
          )}

          {"dealerships" in data && (
            <Panel>
              <DealershipsList dealerships={data.dealerships} />
            </Panel>
          )}
          {"drives" in data && (
            <Panel>
              <DrivesList drives={data.drives.rows} />
              {pager(data.drives.page, data.drives.pages, "drives")}
            </Panel>
          )}
          {"saved" in data && (
            <Panel>
              <SavedList saved={data.saved.rows} />
              {pager(data.saved.page, data.saved.pages, "saved")}
            </Panel>
          )}
          {"reviews" in data && (
            <Panel>
              <ReviewsList reviews={data.reviews} />
            </Panel>
          )}
          {"sessions" in data && (
            <Panel>
              <SessionsList sessions={data.sessions.rows} />
              {pager(data.sessions.page, data.sessions.pages, "sessions")}
            </Panel>
          )}
          {"activity" in data && (
            <Panel>
              <ActivityFeed activity={data.activity} />
              {pager(
                data.activity.pagination.page,
                data.activity.pagination.totalPages,
                "activity",
              )}
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
