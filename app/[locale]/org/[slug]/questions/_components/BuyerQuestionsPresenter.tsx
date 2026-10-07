"use client";

import { useRef, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { useBuyerQuestions } from "@/hooks/use-buyer-questions";
import { BUYER_QUESTION_VIEWS } from "@/lib/validations/schemas";
import { cn } from "@/lib/utils";
import { OrgPageHeader } from "../../_components/OrgPageHeader";
import { QuestionRow } from "./QuestionRow";
import type { AnswerDraft } from "./AnswerEditor";

export type BuyerQuestionsPresenterProps = ReturnType<typeof useBuyerQuestions>;
export type InboxQuestion = BuyerQuestionsPresenterProps["questions"][number];

/**
 * Buyer questions as a teaching queue (canvas: Buyer questions round 1,
 * "1 · Teach queue"): the most-asked gap first, answered in place. In the
 * Unanswered view the top question opens ready to answer, and publishing one
 * opens the next, so a dealer can clear the queue without hunting for it.
 */
export const BuyerQuestionsPresenter = ({
  view,
  questions,
  counts,
  pagination,
  isLoading,
  isError,
  pendingId,
  retry,
  handlers,
}: BuyerQuestionsPresenterProps) => {
  const t = useTranslations("org.buyerQuestions");
  const fmt = useFormatters();
  // undefined: nobody chose, so the queue's head is open (Unanswered only).
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  // Answered or moved away here; hidden at once rather than after the refetch.
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const [focusNext, setFocusNext] = useState(false);
  // Unsent answers by question, kept while the dealer moves between rows.
  const drafts = useRef(new Map<string, AnswerDraft>());

  const shown = questions.filter((question) => !gone.has(question.id));
  const activeId = openId === undefined ? (view === "OPEN" ? shown[0]?.id : undefined) : openId;

  const selectView = (next: typeof view) => {
    handlers.selectView(next);
    setOpenId(undefined);
    setGone(new Set());
    setFocusNext(false);
  };
  /** The question has left this view: hide it and move the queue on. */
  const leave = (id: string) => {
    drafts.current.delete(id);
    setGone((current) => new Set(current).add(id));
    setOpenId(undefined);
    setFocusNext(true);
  };
  /** Close a row and forget its unsent text. */
  const closeAndForget = (id: string) => {
    drafts.current.delete(id);
    setOpenId(null);
  };
  const settle = (work: Promise<unknown>, onDone: () => void) =>
    // The hook has already said why it failed; the row stays as it was.
    work.then(onDone, () => {});

  return (
    <div className="flex w-full flex-col gap-5">
      <OrgPageHeader title={t("title")} description={t("subtitle")} className="mb-0 md:mb-0" />

      <div className="flex flex-col gap-2">
        <div role="group" aria-label={t("views.label")} className="flex flex-wrap gap-2">
          {BUYER_QUESTION_VIEWS.map((key) => {
            const count = counts?.[key];
            const on = view === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => selectView(key)}
                className={cn(
                  "flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 text-caption font-semibold transition-colors sm:h-11",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  on ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-card hover:bg-muted",
                )}
              >
                {t(`views.${key}`)}
                {count !== undefined &&
                  (key === "OPEN" ? (
                    // Marker yellow: questions waiting on the dealer, like every "waiting" count.
                    count > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-marker px-1.5 text-micro tabular-nums text-marker-foreground">
                        {fmt.number(count)}
                      </span>
                    )
                  ) : (
                    <span className={cn("tabular-nums", on ? "text-inverse-foreground/80" : "text-muted-foreground")}>{fmt.number(count)}</span>
                  ))}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted-foreground">{t(`hints.${view}`)}</p>
      </div>

      {isLoading ? (
        <QueueSkeleton />
      ) : isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] border border-border bg-card p-6">
          <p className="text-body">{t("loadFailed")}</p>
          <Button variant="outline-strong" size="control" className="h-11 border bg-field" onClick={retry}>
            {t("retry")}
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-6 py-14 text-center">
          <MessageCircleQuestion aria-hidden className="size-9 text-muted-foreground/60" />
          <p className="text-body font-semibold">{t(`empty.${view}.title`)}</p>
          <p className="max-w-[46ch] text-caption text-muted-foreground">{t(`empty.${view}.description`)}</p>
        </div>
      ) : (
        <div className="flex flex-col sm:overflow-hidden sm:rounded-[20px] sm:border sm:border-border sm:bg-card">
          <ul className="flex flex-col gap-3 sm:gap-0">
            {shown.map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                isOpen={activeId === question.id}
                isPending={pendingId === question.id}
                autoFocus={focusNext || openId === question.id}
                draft={drafts.current.get(question.id)}
                onDraft={(draft) => drafts.current.set(question.id, draft)}
                onOpen={() => setOpenId(question.id)}
                onClose={() => setOpenId(null)}
                onDiscard={() => closeAndForget(question.id)}
                onAnswer={(answer, appliesToAllCars) =>
                  settle(handlers.answer({ id: question.id, answer, appliesToAllCars }), () =>
                    // A new answer leaves Unanswered; an edited one stays where it is,
                    // unless it no longer applies to every car in that view.
                    view === "OPEN" || (view === "ALL_CARS" && !appliesToAllCars) ? leave(question.id) : closeAndForget(question.id),
                  )
                }
                onDismiss={() => settle(handlers.dismiss(question.id), () => leave(question.id))}
                onReopen={() => settle(handlers.reopen(question.id), () => leave(question.id))}
              />
            ))}
          </ul>
          {pagination.totalPages > 1 && <Pages pagination={pagination} setPage={handlers.setPage} />}
        </div>
      )}
    </div>
  );
};

function Pages({
  pagination,
  setPage,
}: {
  pagination: BuyerQuestionsPresenterProps["pagination"];
  setPage: (page: number) => void;
}) {
  const t = useTranslations("org.buyerQuestions.pages");
  const fmt = useFormatters();
  const from = (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <nav
      aria-label={t("label")}
      className="mt-3 flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground sm:mt-0 sm:border-t sm:border-border sm:px-[22px] sm:py-3"
    >
      <span className="tabular-nums">{t("status", { from: fmt.number(from), to: fmt.number(to), total: fmt.number(pagination.total) })}</span>
      <span className="flex gap-2">
        <Button variant="outline-strong" size="control" className="h-11 border bg-field" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>
          {t("previous")}
        </Button>
        <Button
          variant="outline-strong"
          size="control"
          className="h-11 border bg-field"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setPage(pagination.page + 1)}
        >
          {t("next")}
        </Button>
      </span>
    </nav>
  );
}

function QueueSkeleton() {
  return (
    <ul aria-busy className="flex flex-col gap-3 sm:gap-0 sm:overflow-hidden sm:rounded-[20px] sm:border sm:border-border sm:bg-card">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 sm:rounded-none sm:border-0 sm:border-t sm:px-[22px] sm:py-[18px] sm:first:border-t-0">
          <span className="skeleton-shimmer hidden h-14 w-16 rounded-xl sm:block" />
          <span className="flex flex-1 flex-col gap-2 pt-1">
            <span className="skeleton-shimmer h-5 w-2/3 rounded" />
            <span className="skeleton-shimmer h-3.5 w-2/5 rounded" />
          </span>
        </li>
      ))}
    </ul>
  );
}
