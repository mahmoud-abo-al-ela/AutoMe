import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, CarFront, CircleHelp, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ActionResponse } from "@/lib/utils/response";
import { PricePlate } from "@/components/brand";
import { formatNumber } from "@/lib/utils/number";
import { formatClockTime, formatDate } from "@/lib/utils/datetime";
import { storefrontUrl } from "@/lib/utils/tenant-host";
import { cn } from "@/lib/utils";
import type { OverviewPoint } from "../_components/OverviewChart";
import type { ConversionFunnelData, PopularCar, RevenueMetrics } from "../_components/dashboard-types";
import type { InventoryBreakdownData } from "../_components/InventoryBreakdown";
import type { TestDriveTrendPoint } from "../_components/TestDriveTrends";
import type { TodayBoard } from "@/lib/repositories/dashboard/today";
import OverviewChart from "../_components/OverviewChart";
import ConversionFunnel from "../_components/ConversionFunnel";
import InventoryBreakdown from "../_components/InventoryBreakdown";
import TestDriveTrends from "../_components/TestDriveTrends";
import { Panel, PanelEmpty, StatGrid } from "../_components/Panel";
import { TEST_DRIVE_STATUS_TONE } from "../_components/status-tones";
import { DashboardPlanBanners } from "./_components/dashboard-plan-banners";
import { TaskCard } from "./_components/TaskCard";
import { MessagesTaskCard } from "./_components/MessagesTaskCard";
import { PlanUsageBar } from "./_components/PlanUsageBar";
import {
  getAnalytics,
  getConversionFunnel,
  getOverviewChartData,
  getPopularCarsData,
  getTestDriveTrendsData,
  getTodayBoard,
} from "@/actions/dashboard";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.dashboard.meta" });
  return { title: t("title"), description: t("description") };
}

/**
 * Pull `.data` out of a settled action result. Checks `success` as well as
 * `fulfilled`, so an action returning an error envelope takes the fallback
 * declared at the call site instead of handing a component undefined.
 */
function extract<T>(result: PromiseSettledResult<ActionResponse<T>>, fallback: T | null = null): T | null {
  return result.status === "fulfilled" && result.value?.success ? result.value.data : fallback;
}

type Board = TodayBoard & { organizationId: string; firstName: string | null; cairoHour: number };

/**
 * The dealer's overview (canvas: Dashboard A — Showroom). It opens on what is
 * waiting: a greeting, then a card each for test drives to confirm, buyer
 * questions to answer and unread messages, the urgent ones in marker yellow.
 * Then the numbers as one strip, today's test-drive schedule beside the cars
 * buyers save most, the plan, and the trends further down for a closer look.
 *
 * Every figure is read live; a failed read drops its part, not the page.
 * Times and the "today" boundary are Cairo's.
 */
export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("org.dashboard.today");
  const tStatus = await getTranslations("testDrive.status");
  const n = (value: number) => formatNumber(value, locale);
  const base = `/org/${slug}`;

  const results = await Promise.allSettled([
    getTodayBoard(),
    getAnalytics(),
    getConversionFunnel(),
    getPopularCarsData(),
    getOverviewChartData(),
    getTestDriveTrendsData(),
  ]);
  const board = extract<Board>(results[0]);
  const analytics = extract<{ inventory: InventoryBreakdownData; revenue: RevenueMetrics }>(results[1]);
  const funnel = extract<ConversionFunnelData>(results[2]);
  const popular = extract<PopularCar[]>(results[3], []) ?? [];
  const chartData = extract<OverviewPoint[]>(results[4], []) ?? [];
  const trends = extract<TestDriveTrendPoint[]>(results[5], []) ?? [];

  const greeting = t(
    `greeting.${!board || board.cairoHour < 12 ? "morning" : board.cairoHour < 17 ? "afternoon" : "evening"}`,
  );
  const waiting = (board?.pendingCount ?? 0) + (board?.openQuestions ?? 0);
  // One marker-yellow card at most: the first with work waiting. A buyer is
  // waiting on a test-drive confirmation more urgently than on an answer.
  const drivesUrgent = (board?.pendingCount ?? 0) > 0;
  const questionsUrgent = !drivesUrgent && (board?.openQuestions ?? 0) > 0;
  const today = new Date();
  const todayKey = formatDate(today, "en", { year: "numeric", month: "2-digit", day: "2-digit" });

  const carName = (car: { make: string; model: string; year: number } | null) =>
    car ? `${car.make} ${car.model} ${formatNumber(car.year, locale, { useGrouping: false })}` : "";
  // "Ahmed S." — enough to recognise on a busy day.
  const buyerName = (name: string | null | undefined) => {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return t("road.anonymousBuyer");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0];
  };
  // A slot on another day carries its weekday, so "10:00" never reads as today.
  const slot = (drive: { date: Date | string; startTime: string }) => {
    const time = formatClockTime(drive.startTime, locale);
    const sameDay = formatDate(drive.date, "en", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }) === todayKey;
    return sameDay ? time : `${formatDate(drive.date, locale, { weekday: "short", day: undefined, month: undefined, year: undefined, timeZone: "UTC" })} ${time}`;
  };

  const completion = funnel && funnel.total > 0 ? funnel.completed / funnel.total : null;
  const weekDelta = board ? board.requestedThisWeek - board.requestedLastWeek : 0;

  return (
    <div className="flex flex-col gap-8">
      <DashboardPlanBanners orgSlug={slug} />

      {/* Greeting */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-caption font-semibold text-muted-foreground">
            {formatDate(today, locale, { weekday: "long", day: "numeric", month: "long", year: undefined })}
          </p>
          <h1 className="text-h1 font-black">
            {board?.firstName ? t("hello", { greeting, name: board.firstName }) : t("helloNoName", { greeting })}{" "}
            <span className="text-primary">{t("waiting", { count: waiting, value: n(waiting) })}</span>
          </h1>
        </div>
        <a
          href={storefrontUrl(slug, locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption font-semibold text-primary hover:underline"
        >
          {t("storefront")} <span aria-hidden>↗</span>
        </a>
      </header>

      {/* Waiting on you */}
      <section aria-label={t("tasksLabel")} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TaskCard
          href={`${base}/test-drives`}
          icon={<CalendarDays />}
          count={n(board?.pendingCount ?? 0)}
          title={t("tasks.drives.title")}
          urgent={drivesUrgent}
          detail={
            board && board.pendingNext.length > 0
              ? [
                  board.pendingNext
                    .map((drive) => t("tasks.drives.next", { name: buyerName(drive.user?.name), time: slot(drive) }))
                    .join(" · "),
                  board.pendingCount > board.pendingNext.length
                    ? t("tasks.drives.more", { count: n(board.pendingCount - board.pendingNext.length) })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" ")
              : t("tasks.drives.empty")
          }
        />
        <TaskCard
          href={`${base}/questions`}
          icon={<CircleHelp />}
          count={n(board?.openQuestions ?? 0)}
          title={t("tasks.questions.title")}
          urgent={questionsUrgent}
          detail={
            board?.latestQuestion
              ? board.latestQuestion.car
                ? t("tasks.questions.latest", {
                    question: board.latestQuestion.question,
                    car: carName(board.latestQuestion.car),
                  })
                : t("tasks.questions.latestNoCar", { question: board.latestQuestion.question })
              : t("tasks.questions.empty")
          }
        />
        {board && <MessagesTaskCard organizationId={board.organizationId} href={`${base}/messages`} />}
      </section>

      {/* Numbers */}
      <StatGrid
        columns={4}
        items={[
          {
            key: "cars",
            label: t("kpis.cars"),
            value: n(analytics?.inventory.total ?? 0),
            note: t("kpis.carsNote", { count: n(analytics?.revenue.addedThisMonth ?? 0) }),
          },
          {
            key: "drives",
            label: t("kpis.drives"),
            value: n(board?.requestedThisWeek ?? 0),
            note: t("kpis.drivesNote", {
              delta: formatNumber(weekDelta, locale, { signDisplay: "exceptZero" }),
            }),
          },
          {
            key: "saved",
            label: t("kpis.saved"),
            value: n(board?.savedTotal ?? 0),
            note: t("kpis.savedNote", { count: board?.savedCarCount ?? 0, value: n(board?.savedCarCount ?? 0) }),
          },
          {
            key: "completion",
            label: t("kpis.completion"),
            value: completion === null ? "–" : formatNumber(completion, locale, { style: "percent", maximumFractionDigits: 0 }),
            note: t("kpis.completionNote"),
          },
        ]}
      />

      <div className="flex flex-wrap items-start gap-6">
        {/* Today on the road */}
        <Panel
          title={t("road.title")}
          actions={
            <Link href={`${base}/test-drives`} className="text-caption font-semibold text-primary hover:underline">
              {t("road.all")}
            </Link>
          }
          className="flex-[1_1_420px]"
        >
          {board && board.todayDrives.length > 0 ? (
            <ol className="-my-2">
              {board.todayDrives.map((drive) => (
                <li key={drive.id} className="flex items-center gap-4 border-t border-border py-3.5 first:border-t-0">
                  <span className="w-16 shrink-0 text-[1.125rem] font-black tabular-nums">
                    {formatClockTime(drive.startTime, locale)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold">{buyerName(drive.user?.name)}</span>
                    <span className="truncate text-caption text-muted-foreground" dir="auto">
                      {carName(drive.car)}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-micro font-bold", TEST_DRIVE_STATUS_TONE[drive.status].badge)}>
                    {tStatus(drive.status)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <PanelEmpty icon={CalendarDays} title={t("road.empty")} className="py-6" />
          )}
        </Panel>

        {/* Most saved */}
        <section aria-labelledby="saved-title" className="flex min-w-0 flex-[1.4_1_520px] flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="saved-title" className="text-h3 font-bold">
              {t("saved.title")}
            </h2>
            <Link href={`${base}/cars`} className="text-caption font-semibold text-primary hover:underline">
              {t("saved.all")}
            </Link>
          </div>
          {popular.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {popular.slice(0, 4).map((car) => (
                <li key={car.id}>
                  <Link
                    href={`${base}/cars/${car.id}/edit`}
                    className="group flex h-full flex-col overflow-hidden rounded-sheet border border-border bg-card transition-colors hover:border-border-strong/40"
                  >
                    <span className="relative flex aspect-[16/10] items-center justify-center bg-muted">
                      {car.image ? (
                        <Image src={car.image} alt="" fill sizes="(min-width: 1280px) 20vw, (min-width: 640px) 45vw, 90vw" className="object-cover" />
                      ) : (
                        <CarFront aria-hidden className="size-12 text-disabled-foreground" />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col gap-2.5 p-4">
                      <span className="truncate font-bold" dir="auto">
                        {carName(car)}
                      </span>
                      <span className="mt-auto flex items-center justify-between gap-2">
                        <PricePlate amount={Number(car.price)} size="sm" />
                        <span className="flex items-center gap-1 text-caption font-bold tabular-nums">
                          <Heart aria-hidden className="size-3.5 fill-destructive text-destructive" />
                          {n(car.savedCount)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Panel>
              <PanelEmpty icon={Heart} title={t("saved.emptyTitle")} body={t("saved.emptyBody")} />
            </Panel>
          )}
        </section>
      </div>

      <PlanUsageBar orgSlug={slug} />

      {/* Trends */}
      <section aria-labelledby="trends-title" className="flex flex-col gap-5 pt-2">
        <h2 id="trends-title" className="text-h2 font-extrabold">
          {t("trends")}
        </h2>
        <OverviewChart data={chartData} />
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ConversionFunnel funnel={funnel} />
          </div>
          <div className="lg:col-span-2">
            <InventoryBreakdown breakdown={analytics?.inventory} />
          </div>
        </div>
        <TestDriveTrends data={trends} />
      </section>
    </div>
  );
}
