"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CarFront, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useDescribeEntry } from "@/components/dashboard/use-describe-entry";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { UserDetail } from "@/lib/services/super-admin/user-detail";
import { Pager } from "../../../organizations/[id]/_components/RecordTabs";

type Summary = Extract<UserDetail, { summary: unknown }>["summary"];
type Drive = Summary["drives"][number];
type Saved = Summary["saved"][number];
type Session = Summary["sessions"][number];
type Activity = NonNullable<Summary["activity"]>;
type Membership = Summary["dealerships"][number];

const panel = "overflow-hidden rounded-[20px] border border-border bg-card";
const th = "px-3 py-3 text-center font-semibold first:ps-5 first:text-start";
const td = "px-3 py-3 text-center first:ps-5 first:text-start";
const DRIVE_TONES: Record<string, string> = {
  PENDING: "bg-[#fff1c2] text-[#7a5200]",
  CONFIRMED: "bg-positive-soft text-positive",
  COMPLETED: "bg-[#e7eef8] text-[#1d4e9e]",
  CANCELLED: "bg-muted text-muted-foreground",
};
const CAR_TONES: Record<string, string> = {
  AVAILABLE: "bg-positive-soft text-positive",
  UNAVAILABLE: "bg-muted text-muted-foreground",
  SOLD: "bg-[#e7eef8] text-[#1d4e9e]",
};

const pill = (tone: string, text: ReactNode) => <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold", tone)}>{text}</span>;

function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={panel}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="text-[1.25rem] font-extrabold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="border-t border-border px-4 py-6 text-center text-caption text-muted-foreground sm:px-5">{text}</p>;
}

const dealershipLink = (org: { id: string; name: string }) => (
  <Link href={`/super-admin/organizations/${org.id}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
    <bdi>{org.name}</bdi>
  </Link>
);

/** A car's name, as the dealer pages write it: make, model, year in Latin digits. */
function useCarName() {
  const fmt = useFormatters();
  return (car: { make: string; model: string; year: number }) => `${car.make} ${car.model} ${fmt.number(car.year, { useGrouping: false })}`;
}

export function DrivesList({ drives }: { drives: Drive[] }) {
  const t = useTranslations("superAdmin.users.details");
  const fmt = useFormatters();
  const carName = useCarName();
  const when = (d: Drive) => `${fmt.date(`${d.date}T00:00:00Z`, { year: undefined, timeZone: "UTC" })}${fmt.locale === "ar" ? "، " : ", "}${fmt.clockTime(d.startTime)}`;
  if (drives.length === 0) return <Empty text={t("empty.drives")} />;
  return (
    <>
      <ul className="flex flex-col border-t border-border lg:hidden">
        {drives.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="font-semibold"><bdi>{carName(d.car)}</bdi></p>
              <p className="text-micro text-muted-foreground">
                {d.organization.name}
                {fmt.locale === "ar" ? "، " : ", "}
                {when(d)}
              </p>
            </div>
            {pill(DRIVE_TONES[d.status], t(`driveStatus.${d.status}`))}
          </li>
        ))}
      </ul>
      <div className="relative hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[640px] border-collapse text-caption">
          <thead>
            <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
              <th scope="col" className={th}>{t("columns.car")}</th>
              <th scope="col" className={th}>{t("columns.dealership")}</th>
              <th scope="col" className={th}>{t("columns.when")}</th>
              <th scope="col" className={th}>{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-b-0">
                <td className={cn(td, "font-semibold")}><bdi>{carName(d.car)}</bdi></td>
                <td className={td}>{dealershipLink(d.organization)}</td>
                <td className={cn(td, "whitespace-nowrap text-muted-foreground")}>{when(d)}</td>
                <td className={td}>{pill(DRIVE_TONES[d.status], t(`driveStatus.${d.status}`))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SavedList({ saved }: { saved: Saved[] }) {
  const t = useTranslations("superAdmin.users.details");
  const tStatus = useTranslations("org.cars.ledger.status");
  const fmt = useFormatters();
  const carName = useCarName();
  if (saved.length === 0) return <Empty text={t("empty.saved")} />;
  return (
    <ul className="flex flex-col border-t border-border">
      {saved.map((s) => (
        <li key={s.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:px-5">
          <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-muted text-muted-foreground">
            {s.car.image ? <Image src={s.car.image} alt="" fill sizes="64px" className="object-cover" /> : <CarFront aria-hidden className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold"><bdi>{carName(s.car)}</bdi></p>
            <p className="text-micro text-muted-foreground">
              {dealershipLink(s.car.organization)}
              {fmt.locale === "ar" ? "، " : ", "}
              <span className="tabular-nums">{fmt.price(s.car.price)}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {pill(CAR_TONES[s.car.status], tStatus(s.car.status))}
            <span className="text-micro text-muted-foreground">{fmt.date(s.savedAt, { year: undefined })}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SessionsList({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("superAdmin.users.details");
  const fmt = useFormatters();
  if (sessions.length === 0) return <Empty text={t("empty.sessions")} />;
  const length = (s: Session) => {
    if (!s.endedAt) return pill("bg-[#fff1c2] text-[#7a5200]", t("stillOpen"));
    const minutes = Math.max(1, Math.round((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 60000));
    return t("minutes", { count: minutes, value: fmt.number(minutes) });
  };
  return (
    <ul className="flex flex-col border-t border-border">
      {sessions.map((s) => (
        <li key={s.id} className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-caption">
              {dealershipLink(s.organization)}
              <span className="text-muted-foreground">
                {" "}
                {t("columns.signedInAs")} <bdi>{s.targetUser.name || s.targetUser.email}</bdi>
              </span>
            </p>
            <p className="text-micro text-muted-foreground">{s.reason}</p>
          </div>
          <div className="flex items-center gap-3 text-micro text-muted-foreground">
            <span>{fmt.dateTime(s.startedAt, { year: undefined })}</span>
            <span>{length(s)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Their activity as sentences, newest first, each with the dealership it was at. */
export function ActivityFeed({ activity }: { activity: Activity }) {
  const t = useTranslations("superAdmin.users.details");
  const fmt = useFormatters();
  const describe = useDescribeEntry(activity.lookups, "");
  if (activity.entries.length === 0) return <Empty text={t("empty.activity")} />;
  return (
    <ul className="flex flex-col border-t border-border">
      {activity.entries.map((entry) => {
        const { sentence, changes } = describe(entry);
        return (
          <li key={entry.id} className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:px-5">
            <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", entry.bySupport ? "bg-chart-1" : "bg-[#8c8170]")} />
            <div className="min-w-0 flex-1">
              <p className="text-caption text-muted-foreground">{sentence}</p>
              {changes.length > 0 && (
                <dl className="mt-1 flex flex-col gap-0.5 text-micro">
                  {changes.map((change) => (
                    <div key={change.key} className="flex flex-wrap gap-x-2">
                      <dt className="text-muted-foreground">{change.label}</dt>
                      <dd>
                        <s className="text-muted-foreground">{change.before}</s> <span aria-hidden>→</span> <b className="font-semibold">{change.after}</b>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-0.5 text-micro text-muted-foreground">
                {fmt.dateTime(entry.createdAt, { year: undefined })}
                {entry.dealership && (
                  <>
                    {fmt.locale === "ar" ? "، " : ", "}
                    {dealershipLink(entry.dealership)}
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const STANDING: Record<string, string> = { PAST_DUE: "bg-destructive-soft text-destructive", TRIALING: "bg-[#fff1c2] text-[#7a5200]" };

export function DealershipsList({ dealerships }: { dealerships: Membership[] }) {
  const t = useTranslations("superAdmin.users.details");
  const tOrg = useTranslations("superAdmin.organizations");
  const fmt = useFormatters();
  if (dealerships.length === 0) return <Empty text={t("empty.dealerships")} />;
  return (
    <ul className="flex flex-col border-t border-border">
      {dealerships.map((m) => {
        const status = m.organization.subscription?.status;
        return (
          <li key={m.id} className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body font-bold">
                  <bdi>{m.organization.name}</bdi>
                </span>
                {pill(m.role === "OWNER" ? "bg-[#e7eef8] text-[#1d4e9e]" : "bg-muted text-muted-foreground", t(`role.${m.role}`))}
                {!m.organization.isActive
                  ? pill("bg-muted text-muted-foreground", tOrg("status.suspended"))
                  : status && STANDING[status] && pill(STANDING[status], tOrg(status === "PAST_DUE" ? "views.overdue" : "views.trial"))}
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 text-micro text-muted-foreground">
                <span>{t("dealershipJoined", { date: fmt.date(m.joinedAt) })}</span>
                <span>{t("dealershipCarsAdded", { value: fmt.number(m.carsAdded) })}</span>
                <span>{t("dealershipChanges", { value: fmt.number(m.recentChanges) })}</span>
              </p>
            </div>
            <Link
              href={`/super-admin/organizations/${m.organization.id}`}
              className="inline-flex h-10 items-center justify-center rounded-control border-2 border-border-strong bg-field px-4 text-caption font-semibold hover:bg-muted"
            >
              {t("openDealership")}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ReviewsList({ reviews }: { reviews: Extract<UserDetail, { reviews: unknown }>["reviews"] }) {
  const t = useTranslations("superAdmin.users.details");
  const fmt = useFormatters();
  if (reviews.length === 0) return <Empty text={t("empty.reviews")} />;
  return (
    <ul className="flex flex-col border-t border-border">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col gap-1.5 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {dealershipLink(r.organization)}
            <span className="flex items-center gap-1 text-caption font-semibold" aria-label={t("reviewStars", { value: fmt.number(r.rating) })}>
              <Star aria-hidden className="size-4 fill-[#e0a400] text-[#e0a400]" />
              {fmt.number(r.rating)}
            </span>
            {pill(r.isApproved ? "bg-positive-soft text-positive" : "bg-[#fff1c2] text-[#7a5200]", r.isApproved ? t("reviewPublished") : t("reviewPending"))}
            <span className="ms-auto text-micro text-muted-foreground">{fmt.date(r.createdAt)}</span>
          </div>
          {r.title && <p className="font-semibold">{r.title}</p>}
          {r.comment && <p className="text-caption text-muted-foreground">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}

export { Panel, Pager };
