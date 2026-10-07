import { Fragment, type CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { TestDriveStatus } from "@/lib/generated/prisma";
import { formatClockTime } from "@/lib/utils/datetime";
import { formatNumber } from "@/lib/utils/number";
import { cn } from "@/lib/utils";

export type RoadDrive = {
  id: string;
  startTime: string;
  status: TestDriveStatus;
  buyer: string;
  car: string;
};

export type RoadHours =
  | { state: "open"; open: string; close: string }
  | { state: "closed" }
  | { state: "none" };

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Where the road starts and ends: today's hours, or a working day around the bookings. */
function span(hours: RoadHours, drives: RoadDrive[]) {
  let from = hours.state === "open" ? minutes(hours.open) : 9 * 60;
  let to = hours.state === "open" ? minutes(hours.close) : 21 * 60;
  for (const drive of drives) {
    from = Math.min(from, minutes(drive.startTime));
    to = Math.max(to, minutes(drive.startTime) + 30);
  }
  return { from, to: Math.max(to, from + 60) };
}

const at = (value: number, from: number, to: number) =>
  `${((value - from) / (to - from)) * 100}%`;

/** On an inline-start offset, centred whichever way the page reads. */
const centred = "ltr:-translate-x-1/2 rtl:translate-x-1/2";

/**
 * Today's test drives drawn as a road across the dealership's opening hours
 * (canvas: Round 3 — Overview), the page's one bold element and the site's
 * road motif (RoadLoader, the home page's story). A stop on the road for each
 * drive — marker yellow while it waits for the dealer to confirm — and a
 * white "now" line while the day is under way. The road follows the reading
 * direction like a progress bar does; chart value axes stay physical.
 *
 * The drives are also a plain list under the road, which is what screen
 * readers get: the road itself is decoration.
 */
export async function TodayRoad({
  drives,
  hours,
  now,
  locale,
  href,
}: {
  drives: RoadDrive[];
  hours: RoadHours;
  /** "HH:mm" in Cairo. */
  now: string;
  locale: Locale;
  href: string;
}) {
  const t = await getTranslations("org.dashboard.today.road");
  const clock = (time: string) => formatClockTime(time, locale);
  const { from, to } = span(hours, drives);
  const nowMinutes = minutes(now);
  const showNow =
    hours.state === "open" && nowMinutes >= from && nowMinutes <= to;
  // Where "now" falls among the drives, for the phone list.
  const nowIndex = drives.filter(
    (drive) => minutes(drive.startTime) <= nowMinutes,
  ).length;
  const ticks: number[] = [];
  for (let tick = Math.ceil(from / 120) * 120; tick <= to; tick += 120)
    ticks.push(tick);
  const tickLabel = (value: number) =>
    clock(
      `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`,
    );

  const status =
    hours.state === "open"
      ? t("hours", { open: clock(hours.open), close: clock(hours.close) })
      : hours.state === "closed"
        ? t("closed")
        : t("noHours");

  return (
    <section
      aria-labelledby="road-title"
      className="rounded-sheet bg-inverse p-5 text-inverse-foreground sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="road-title" className="text-h3 font-semibold">
          {t("title")}
        </h2>
        <p className="text-caption text-inverse-foreground/75">
          {status}.{" "}
          {t("booked", {
            count: drives.length,
            value: formatNumber(drives.length, locale),
          })}
          .{" "}
          <Link
            href={href}
            className="font-semibold text-plate-band underline-offset-4 hover:underline"
          >
            {t("calendar")}
          </Link>
        </p>
      </div>

      {/* The road, across the hours (sm and up) */}
      <div aria-hidden className="relative mt-6 hidden h-16 sm:block">
        <div className="absolute inset-x-0 top-2 h-9 rounded-control bg-inverse-hover">
          <span
            className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--marker) 0 24px, transparent 24px 44px)",
            }}
          />
        </div>
        {/* Stops and "now" sit on an inset track, so a drive at opening or
            closing time stays on the road instead of hanging off its end. */}
        <div className="absolute inset-x-3 inset-y-0">
          {drives.map((drive) => (
            <span
              key={drive.id}
              className={cn(
                "absolute top-3.5 size-6 rounded-full border-[3px] border-inverse",
                centred,
                drive.status === "PENDING"
                  ? "bg-marker"
                  : drive.status === "COMPLETED"
                    ? "bg-inverse-foreground/40"
                    : "bg-inverse-foreground",
              )}
              style={
                {
                  insetInlineStart: at(minutes(drive.startTime), from, to),
                } as CSSProperties
              }
            />
          ))}
          {showNow && (
            <span
              className={cn(
                "absolute top-0 h-[52px] w-[3px] rounded-full bg-inverse-foreground",
                centred,
              )}
              style={{ insetInlineStart: at(nowMinutes, from, to) }}
            />
          )}
        </div>
        {/* Hour labels: the opening and closing times sit flush with the
            road's ends; the even hours between are centred on their spot and
            dropped where they would crowd an end label. Never wrapped. */}
        <div className="absolute inset-x-0 top-12 whitespace-nowrap text-micro text-inverse-foreground/60">
          <span className="absolute start-0">{tickLabel(from)}</span>
          {ticks
            .filter(
              (tick) =>
                (tick - from) / (to - from) > 0.16 &&
                (tick - from) / (to - from) < 0.84,
            )
            .map((tick) => (
              <span
                key={tick}
                className={cn("absolute", centred)}
                style={{ insetInlineStart: at(tick, from, to) }}
              >
                {tickLabel(tick)}
              </span>
            ))}
          <span className="absolute end-0">{tickLabel(to)}</span>
        </div>
      </div>
      {showNow && (
        <p className="mt-1 hidden text-micro font-semibold sm:block">
          {t("now", { time: clock(now) })}
        </p>
      )}

      {/* The drives, in time order. On phones the road turns and runs down
          their side, with "now" in its place among them (canvas: Overview on
          a phone). */}
      {drives.length > 0 ? (
        <div className="relative mt-5 ps-8 sm:ps-0">
          <span
            aria-hidden
            className="absolute inset-y-0 start-0 w-3 rounded-full bg-inverse-hover sm:hidden"
          >
            <span
              className="absolute inset-y-2 start-[5px] w-0.5"
              style={{
                background:
                  "repeating-linear-gradient(180deg, var(--marker) 0 14px, transparent 14px 26px)",
              }}
            />
          </span>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {showNow && nowIndex === 0 && (
              <NowItem label={t("now", { time: clock(now) })} />
            )}
            {drives.map((drive, index) => {
              const pending = drive.status === "PENDING";
              const body = (
                <>
                  <span className="block text-h3 font-extrabold tabular-nums">
                    {clock(drive.startTime)}
                  </span>
                  <span className="mt-0.5 block truncate text-caption font-semibold">
                    {drive.buyer}
                  </span>
                  <span className="block truncate text-micro" dir="auto">
                    {drive.car}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-micro font-semibold",
                      pending
                        ? ""
                        : drive.status === "COMPLETED"
                          ? "text-inverse-foreground/75"
                          : "text-muted-foreground",
                    )}
                  >
                    {t(drive.status as "PENDING" | "CONFIRMED" | "COMPLETED")}
                  </span>
                </>
              );
              return (
                <Fragment key={drive.id}>
                  <li>
                    {pending ? (
                      <Link
                        href={href}
                        className="block h-full rounded-control bg-marker px-4 py-3 text-marker-foreground outline-offset-2 transition-transform hover:-translate-y-0.5"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "h-full rounded-control px-4 py-3",
                          drive.status === "COMPLETED"
                            ? "bg-inverse-hover text-inverse-foreground"
                            : "bg-card text-foreground",
                        )}
                      >
                        {body}
                      </div>
                    )}
                  </li>
                  {showNow && nowIndex === index + 1 && (
                    <NowItem label={t("now", { time: clock(now) })} />
                  )}
                </Fragment>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="mt-5 text-body text-inverse-foreground/80">
          {t("empty")}
        </p>
      )}
    </section>
  );
}

/** "Now, 11:40" among the drives on a phone: a white tick on the road. */
function NowItem({ label }: { label: string }) {
  return (
    <li className="relative flex items-center gap-2 text-micro font-semibold sm:hidden">
      <span
        aria-hidden
        className="absolute -start-[30px] h-[3px] w-4 rounded-full bg-inverse-foreground"
      />
      {label}
    </li>
  );
}
