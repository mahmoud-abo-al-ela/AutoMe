import type { ReactNode } from "react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { CarFront } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ActionResponse } from "@/lib/utils/response";
import type { AttentionReason } from "@/lib/services/dashboard";
import type { TodayBoardRows } from "@/lib/repositories/dashboard/today";
import { formatClockTime, formatDate } from "@/lib/utils/datetime";
import { formatNumber } from "@/lib/utils/number";
import { Panel, StatGrid, type StatItem } from "../_components/Panel";
import { DashboardPlanBanners } from "./_components/dashboard-plan-banners";
import { TodayRoad, type RoadHours } from "./_components/TodayRoad";
import { DrivesChart } from "../_components/DrivesChart";
import { CountBadge, OverviewRow } from "./_components/OverviewRow";
import { MessagesRow } from "./_components/MessagesRow";
import { getTestDriveTrendsData, getTodayBoard } from "@/actions/dashboard";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.dashboard.meta" });
  return { title: t("title"), description: t("description") };
}

/** A day of getTestDriveTrendsData: that day's requests by their status now. */
type TestDriveTrendPoint = { date: string; pending: number; confirmed: number; completed: number; cancelled: number };

type Board = Omit<TodayBoardRows, "candidates"> & {
  organizationId: string;
  organizationName: string;
  cairoTime: string;
  attention: {
    total: number;
    items: { id: string; make: string; model: string; year: number; image: string | null; reason: AttentionReason }[];
  };
};

/**
 * The dealer's overview (canvas: Round 3 — Overview; page pattern 4,
 * Dashboard): a read-only glance that links out. A heading and one sentence
 * on what is waiting; today's test drives as a road across the opening hours
 * (the one bold element); four figures for the last 30 days; two lists —
 * what waits on the dealer, and the cars that need a look; then test drives
 * per day. One order at every width (canvas: Overview on a phone), so what is
 * read and tabbed through always matches what is seen. No date range and no editing here: acting happens on the pages the
 * rows open.
 *
 * Every figure is read live; a failed read leaves its part out, not the page.
 * "Today" and its times are Cairo's.
 */
export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("org.dashboard.today");
  const n = (value: number) => formatNumber(value, locale);
  const percent = (value: number) => formatNumber(value, locale, { style: "percent", maximumFractionDigits: 0 });
  const base = `/org/${slug}`;

  const [boardResult, trendsResult] = await Promise.allSettled([getTodayBoard(), getTestDriveTrendsData()]);
  const board = ok<Board>(boardResult);
  const trends = ok<TestDriveTrendPoint[]>(trendsResult) ?? [];

  const carName = (car: { make: string; model: string; year: number } | null | undefined) =>
    car ? `${car.make} ${car.model} ${formatNumber(car.year, locale, { useGrouping: false })}` : "";
  const buyerName = (name: string | null | undefined) => name?.trim() || t("road.anonymousBuyer");

  // "today at 17:00", or "Thu at 11:00" for a drive on another day.
  const todayKey = formatDate(new Date(), "en", { year: "numeric", month: "2-digit", day: "2-digit" });
  const when = (drive: { date: Date | string; startTime: string }) => {
    const time = formatClockTime(drive.startTime, locale);
    const key = formatDate(drive.date, "en", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" });
    if (key === todayKey) return t("road.todayAt", { time });
    const day = formatDate(drive.date, locale, { weekday: "short", day: undefined, month: undefined, year: undefined, timeZone: "UTC" });
    return t("road.dayAt", { day, time });
  };

  const drives = board?.pendingCount ?? 0;
  const questions = board?.openQuestions ?? 0;
  const linkTo = (href: string) =>
    function LinkedChunk(chunks: ReactNode) {
      return (
        <Link href={href} className="font-semibold text-primary underline-offset-4 hover:underline">
          {chunks}
        </Link>
      );
    };
  const waiting =
    drives > 0 && questions > 0
      ? t.rich("waitingBoth", {
          drives,
          drivesValue: n(drives),
          questions,
          questionsValue: n(questions),
          drivesLink: linkTo(`${base}/test-drives`),
          questionsLink: linkTo(`${base}/questions`),
        })
      : drives > 0
        ? t.rich("waitingDrives", { drives, drivesValue: n(drives), drivesLink: linkTo(`${base}/test-drives`) })
        : questions > 0
          ? t.rich("waitingQuestions", { questions, questionsValue: n(questions), questionsLink: linkTo(`${base}/questions`) })
          : t("waitingNone");

  const hours: RoadHours = !board?.hours
    ? { state: "none" }
    : board.hours.isOpen
      ? { state: "open", open: board.hours.openTime, close: board.hours.closeTime }
      : { state: "closed" };

  // A change against the 30 days before, in words — direction is never
  // carried by colour alone.
  const change = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? t("kpis.same") : t("kpis.fromZero");
    const ratio = (current - previous) / previous;
    if (Math.abs(ratio) < 0.005) return t("kpis.same");
    return ratio > 0 ? t("kpis.up", { percent: percent(ratio) }) : t("kpis.down", { percent: percent(-ratio) });
  };

  const kpis: StatItem[] = board
    ? [
        { key: "requests", label: t("kpis.requests"), value: n(board.requested), note: change(board.requested, board.requestedBefore) },
        {
          key: "completed",
          label: t("kpis.completed"),
          value: n(board.completed),
          note: board.requested > 0 ? t("kpis.completedNote", { percent: percent(board.completed / board.requested) }) : t("kpis.completedNoneNote"),
        },
        { key: "saves", label: t("kpis.saves"), value: n(board.saves), note: change(board.saves, board.savesBefore) },
        { key: "cars", label: t("kpis.cars"), value: n(board.carsListed), note: t("kpis.carsNote", { count: n(board.carsAdded) }) },
      ]
    : [];

  const reason = (r: AttentionReason) =>
    r.kind === "stale"
      ? t("attention.stale", { days: n(r.days) })
      : r.kind === "price"
        ? t("attention.price", { percent: percent(r.percent / 100) })
        : t("attention.photos", { count: r.count, value: n(r.count) });

  const chartData = trends.map((point) => ({
    date: point.date,
    requested: point.pending + point.confirmed + point.completed + point.cancelled,
    completed: point.completed,
  }));

  return (
    <div className="flex flex-col gap-8">
      <DashboardPlanBanners orgSlug={slug} />

      <header className="max-w-[72ch]">
        <h1 className="text-h1 font-extrabold">{t("title", { name: board?.organizationName ?? "" })}</h1>
        <p className="mt-2 text-body text-muted-foreground">
          {waiting} {t("periodNote")}
        </p>
      </header>

      {board && (
        <TodayRoad
          drives={board.todayDrives.map((drive) => ({
            id: drive.id,
            startTime: drive.startTime,
            status: drive.status,
            buyer: buyerName(drive.user?.name),
            car: carName(drive.car),
          }))}
          hours={hours}
          now={board.cairoTime}
          locale={locale}
          href={`${base}/test-drives`}
        />
      )}

      {kpis.length > 0 && (
        <section aria-label={t("kpis.label")}>
          <StatGrid columns={4} items={kpis} />
        </section>
      )}

      {board && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title={t("waitingList.title")} bodyClassName="p-0 sm:p-0">
            <ul className="mt-3">
              <OverviewRow
                href={`${base}/test-drives`}
                lead={<CountBadge value={n(drives)} urgent={drives > 0} />}
                title={t("waitingList.drives")}
                detail={
                  board.pendingNext.length > 0
                    ? board.pendingNext.map((drive) => `${buyerName(drive.user?.name)} ${when(drive)}`).join(locale === "ar" ? "، " : ", ")
                    : t("waitingList.drivesNone")
                }
              />
              <OverviewRow
                href={`${base}/questions`}
                lead={<CountBadge value={n(questions)} urgent={drives === 0 && questions > 0} />}
                title={t("waitingList.questions")}
                detail={
                  board.latestQuestion
                    ? t.rich("waitingList.questionsDetail", {
                        // The buyer's words in their own direction, isolated so the
                        // quote marks around them stay in place on either page.
                        q: (chunks) => <bdi>{chunks}</bdi>,
                        question: board.latestQuestion.question,
                        count: board.latestQuestion.askCount,
                        value: n(board.latestQuestion.askCount),
                      })
                    : t("waitingList.questionsNone")
                }
              />
              <MessagesRow organizationId={board.organizationId} href={`${base}/messages`} />
            </ul>
          </Panel>

          <Panel
            title={t("attention.title")}
            actions={
              board.attention.total > 0 && (
                <Link href={`${base}/cars?view=attention`} className="text-caption font-semibold text-primary hover:underline">
                  {t("attention.all", { count: n(board.attention.total) })}
                </Link>
              )
            }
            bodyClassName="p-0 sm:p-0"
          >
            {board.attention.items.length > 0 ? (
              <ul className="mt-3">
                {board.attention.items.map((car) => (
                  <OverviewRow
                    key={car.id}
                    href={`${base}/cars/${car.id}/edit`}
                    lead={
                      <span className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-plate bg-muted">
                        {car.image ? (
                          <Image src={car.image} alt="" fill sizes="56px" className="object-cover" />
                        ) : (
                          <CarFront aria-hidden className="size-5 text-muted-foreground" />
                        )}
                      </span>
                    }
                    title={<span dir="auto">{carName(car)}</span>}
                    detail={reason(car.reason)}
                    // Amber text at 5.6:1 on the card (the chart amber is too light for text).
                    detailClassName={car.reason.kind === "stale" ? "text-destructive" : "text-[#8a5e00]"}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-5 pb-6 pt-3 text-body text-muted-foreground sm:px-6">{t("attention.empty")}</p>
            )}
          </Panel>
        </div>
      )}

      <DrivesChart data={chartData} />
    </div>
  );
}

/** `.data` of a settled action, or the fallback when it failed or returned an error envelope. */
function ok<T>(result: PromiseSettledResult<ActionResponse<T>>, fallback: T | null = null): T | null {
  return result.status === "fulfilled" && result.value?.success ? result.value.data : fallback;
}
