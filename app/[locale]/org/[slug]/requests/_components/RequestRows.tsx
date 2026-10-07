"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, CircleHelp, Loader2, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { OrgUnreadCount } from "@/components/StreamChat";
import { useFormatters } from "@/hooks/use-formatters";
import { cairoNow } from "@/lib/utils/datetime";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { cn } from "@/lib/utils";
import type { DriveRequest, RequestsData } from "@/hooks/use-requests";

export type { DriveRequest } from "@/hooks/use-requests";
export type QuestionRequest = RequestsData["questions"]["items"][number];

type CarLike = { make: string; model: string; year: number; title?: string | null; titleEn?: string | null; titleAr?: string | null };

/** The car as the dealer named it, in the reader's language where there is one. */
export function useCarName() {
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  return (car: CarLike | null | undefined) =>
    car ? (resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model} ${fmt.number(car.year, { useGrouping: false })}`) : "";
}

/** One row of the inbox: a leading tile, what is asked, and the actions, always visible. */
function Row({
  tile,
  title,
  meta,
  actions,
  busy,
}: {
  tile: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  actions: ReactNode;
  busy?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border px-4 py-4 first:border-t-0 sm:px-6">
      {tile}
      <div className="min-w-0 flex-[1_1_18rem]">
        <p className="text-body font-semibold">{title}</p>
        <p className="text-caption text-muted-foreground">{meta}</p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        {busy && <Loader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />}
        {actions}
      </div>
    </li>
  );
}

const tile = (icon: ReactNode, className: string) => (
  <span aria-hidden className={cn("flex size-11 shrink-0 items-center justify-center rounded-control", className)}>
    {icon}
  </span>
);

/** A test drive waiting for the dealer: confirm it here, or decline (confirmed first). */
export function DriveRow({
  drive,
  busy,
  onConfirm,
  onDecline,
}: {
  drive: DriveRequest;
  busy: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("org.requests.drive");
  const fmt = useFormatters();
  const carName = useCarName();
  const day = fmt.date(drive.date, { weekday: "long", day: "numeric", month: "long", year: undefined, timeZone: "UTC" });
  const past = String(drive.date).slice(0, 10) < cairoNow().date;

  return (
    <Row
      busy={busy}
      tile={tile(<CalendarDays className="size-5" />, "bg-marker text-marker-foreground")}
      title={t("title", { buyer: drive.user?.name?.trim() || t("anonymousBuyer"), car: carName(drive.car) })}
      meta={
        <>
          <span className={past ? "font-semibold text-destructive" : undefined}>
            {past ? t("past") : t("when", { day, start: fmt.clockTime(drive.startTime), end: fmt.clockTime(drive.endTime) })}
          </span>
          {". "}
          {t("requested", { when: fmt.relativeToNow(drive.createdAt) })}
        </>
      }
      actions={
        <>
          <Button variant="inverse" size="control" className="h-11 flex-1 sm:flex-none" disabled={busy || past} onClick={onConfirm}>
            {t("confirm")}
          </Button>
          <Button variant="outline-strong" size="control" className="h-11 flex-1 bg-card sm:flex-none" disabled={busy} onClick={onDecline}>
            {t("decline")}
          </Button>
        </>
      }
    />
  );
}

/** A buyer question nobody has answered yet: answer it in the side panel, or dismiss it. */
export function QuestionRow({
  question,
  busy,
  onAnswer,
  onDismiss,
}: {
  question: QuestionRequest;
  busy: boolean;
  onAnswer: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations("org.requests.question");
  const fmt = useFormatters();
  const carName = useCarName();

  return (
    <Row
      busy={busy}
      tile={tile(<CircleHelp className="size-5" />, "bg-primary-soft text-primary")}
      title={<bdi dir="auto">{question.question}</bdi>}
      meta={
        <>
          {t("about", { car: carName(question.car) })}
          {". "}
          {t("asked", { count: question.askCount, value: fmt.number(question.askCount) })}, {t("lastAsked", { when: fmt.relativeToNow(question.lastAskedAt) })}
        </>
      }
      actions={
        <>
          <Button variant="inverse" size="control" className="h-11 flex-1 sm:flex-none" disabled={busy} onClick={onAnswer}>
            {t("answer")}
          </Button>
          <Button variant="ghost" size="control" className="h-11 text-muted-foreground" disabled={busy} onClick={onDismiss}>
            {t("dismiss")}
          </Button>
        </>
      }
    />
  );
}

/**
 * Unread chats, live from the chat connection. Conversations are answered on
 * the Messages page; this row only says how many wait and takes you there.
 */
export function MessagesInboxRow({ organizationId, href }: { organizationId: string; href: string }) {
  const t = useTranslations("org.requests.messages");
  const fmt = useFormatters();

  return (
    <OrgUnreadCount organizationId={organizationId}>
      {(count) => (
        <Link
          href={href}
          className="flex min-h-16 items-center gap-4 rounded-sheet border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50 sm:px-6"
        >
          {tile(<MessageSquare className="size-5" />, count ? "bg-marker text-marker-foreground" : "bg-muted text-foreground")}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-semibold">
              {t("title")}
              {count ? <span className="ms-2 tabular-nums">{fmt.number(count)}</span> : null}
            </span>
            <span className="text-caption text-muted-foreground">
              {count === null ? t("connecting") : count > 0 ? t("some") : t("none")}
            </span>
          </span>
        </Link>
      )}
    </OrgUnreadCount>
  );
}
