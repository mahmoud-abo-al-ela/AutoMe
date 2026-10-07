"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, CircleHelp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { useRequests, type RequestsData, type RequestsView as View } from "@/hooks/use-requests";
import { cn } from "@/lib/utils";
import { OrgPageHeader } from "../../_components/OrgPageHeader";
import { DriveRow, MessagesInboxRow, QuestionRow, type DriveRequest, type QuestionRequest } from "./RequestRows";
import { AnswerSheet } from "./AnswerSheet";
import { DeclineDialog } from "./DeclineDialog";

const VIEWS: View[] = ["all", "drives", "questions"];

/**
 * Requests (canvas: Round 3 — Requests; page pattern 10A, standalone inbox):
 * the things a buyer is waiting on the dealer for, acted on where they are.
 * A test drive is confirmed in its row, or declined after a named
 * confirmation; a question is answered in a side panel, so the list stays in
 * view. Rows, not a table; pages, not endless scroll, so the order holds
 * while the dealer works down it. Unread chats get one row that leads to
 * Messages, where conversations are answered.
 */
export function RequestsPresenter({
  organizationId,
  view,
  drives,
  questions,
  pendingId,
  handlers,
}: RequestsData & { organizationId: string }) {
  const t = useTranslations("org.requests");
  const fmt = useFormatters();
  const { slug } = useParams<{ slug: string }>();
  const base = `/org/${slug}`;
  const [answering, setAnswering] = useState<QuestionRequest | null>(null);
  const [declining, setDeclining] = useState<DriveRequest | null>(null);

  const count = { all: drives.total + questions.total, drives: drives.total, questions: questions.total };
  // No figure until its queue has loaded: a "0" while loading reads as "nothing waiting".
  const loaded = { all: !drives.isLoading && !questions.isLoading, drives: !drives.isLoading, questions: !questions.isLoading };

  return (
    <div className="flex flex-col gap-6">
      <OrgPageHeader title={t("title")} description={t("subtitle")} className="mb-0 md:mb-0" />

      {/* One row at every width; on a narrow phone it scrolls sideways rather than wrapping. */}
      <div
        role="group"
        aria-label={t("views.label")}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            onClick={() => handlers.setView(option)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-caption font-semibold transition-colors sm:gap-2 sm:px-4",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              view === option ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-card hover:bg-muted",
            )}
          >
            {t(`views.${option}`)}
            {loaded[option] && <span className="tabular-nums">{fmt.number(count[option])}</span>}
          </button>
        ))}
      </div>

      {view === "all" && <MessagesInboxRow organizationId={organizationId} href={`${base}/messages`} />}

      {view !== "questions" && (
        <Section
          id="drives"
          title={t("drivesTitle")}
          show={view === "drives"}
          state={drives}
          empty={
            <Empty
              icon={<CalendarDays className="size-6" />}
              title={t("empty.drivesTitle")}
              body={t("empty.drivesBody")}
              cta={{ href: `${base}/test-drives`, label: t("empty.drivesCta") }}
            />
          }
          onPage={handlers.setDrivesPage}
        >
          {drives.items.map((drive) => (
            <DriveRow
              key={drive.id}
              drive={drive}
              busy={pendingId === drive.id}
              onConfirm={() => handlers.confirmDrive(drive.id)}
              onDecline={() => setDeclining(drive)}
            />
          ))}
        </Section>
      )}

      {view !== "drives" && (
        <Section
          id="questions"
          title={t("questionsTitle")}
          show={view === "questions"}
          state={questions}
          empty={
            <Empty
              icon={<CircleHelp className="size-6" />}
              title={t("empty.questionsTitle")}
              body={t("empty.questionsBody")}
              cta={{ href: `${base}/questions`, label: t("empty.questionsCta") }}
            />
          }
          onPage={handlers.setQuestionsPage}
        >
          {questions.items.map((question) => (
            <QuestionRow
              key={question.id}
              question={question}
              busy={pendingId === question.id}
              onAnswer={() => setAnswering(question)}
              onDismiss={() => handlers.dismiss(question.id)}
            />
          ))}
        </Section>
      )}

      <AnswerSheet
        question={answering}
        busy={!!answering && pendingId === answering.id}
        onClose={() => setAnswering(null)}
        onPublish={handlers.answer}
      />
      <DeclineDialog drive={declining} onClose={() => setDeclining(null)} onDecline={handlers.declineDrive} />
    </div>
  );
}

/** One queue: its heading, its rows in a framed list, its pages — or its empty state, in the same frame. */
function Section({
  id,
  title,
  show,
  state,
  empty,
  onPage,
  children,
}: {
  id: string;
  title: string;
  /** Whether this is the only section on screen (its own tab); the heading then repeats the tab. */
  show: boolean;
  state: { items: unknown[]; total: number; page: number; totalPages: number; isLoading: boolean; isError: boolean };
  empty: ReactNode;
  onPage: (page: number) => void;
  children: ReactNode;
}) {
  const t = useTranslations("org.requests");
  const fmt = useFormatters();
  const headingId = `${id}-title`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className={cn("text-h3 font-semibold", show && "sr-only")}>
        {title}
        {!state.isLoading && <span className="ms-2 text-muted-foreground tabular-nums">{fmt.number(state.total)}</span>}
      </h2>

      <div className="overflow-hidden rounded-sheet border border-border bg-card">
        {state.isLoading ? (
          <ul aria-busy className="divide-y divide-border">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <span className="skeleton-shimmer size-11 rounded-control" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="skeleton-shimmer h-4 w-2/3 rounded" />
                  <span className="skeleton-shimmer h-3 w-1/3 rounded" />
                </span>
              </li>
            ))}
          </ul>
        ) : state.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 px-6 py-6">
            <p className="text-body">{t("loadFailed")}</p>
            <Button variant="outline-strong" size="control" onClick={() => window.location.reload()}>
              {t("retry")}
            </Button>
          </div>
        ) : state.items.length === 0 ? (
          empty
        ) : (
          <ul>{children}</ul>
        )}
      </div>

      {state.totalPages > 1 && (
        <nav aria-label={t("pages.label")} className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
          <span>{t("pages.status", { page: fmt.number(state.page), total: fmt.number(state.totalPages) })}</span>
          <span className="flex gap-2">
            <Button variant="outline-strong" size="control" className="h-11 bg-card" disabled={state.page <= 1} onClick={() => onPage(state.page - 1)}>
              {t("pages.previous")}
            </Button>
            <Button
              variant="outline-strong"
              size="control"
              className="h-11 bg-card"
              disabled={state.page >= state.totalPages}
              onClick={() => onPage(state.page + 1)}
            >
              {t("pages.next")}
            </Button>
          </span>
        </nav>
      )}
    </section>
  );
}

/** An empty queue: what belongs here, why it matters, and where to go instead. */
function Empty({ icon, title, body, cta }: { icon: ReactNode; title: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span aria-hidden className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="text-body font-semibold">{title}</p>
      <p className="max-w-sm text-caption text-muted-foreground">{body}</p>
      <Link href={cta.href} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "mt-2 bg-card")}>
        {cta.label}
      </Link>
    </div>
  );
}

/** The page's client half: the queues and their actions. */
export function RequestsView({ organizationId }: { organizationId: string }) {
  return <RequestsPresenter organizationId={organizationId} {...useRequests()} />;
}
