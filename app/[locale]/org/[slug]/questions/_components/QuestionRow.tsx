"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { InboxQuestion } from "./BuyerQuestionsPresenter";
import { AnswerEditor, type AnswerDraft } from "./AnswerEditor";

/** Asked this often, a question is a real gap: its count turns amber. */
const HOT_ASKS = 3;

type Props = {
  question: InboxQuestion;
  isOpen: boolean;
  isPending: boolean;
  autoFocus: boolean;
  draft: AnswerDraft | undefined;
  onDraft: (draft: AnswerDraft) => void;
  onOpen: () => void;
  onClose: () => void;
  /** Close and forget the unsent text: Cancel on an edited answer. */
  onDiscard: () => void;
  onAnswer: (answer: string, appliesToAllCars: boolean) => void;
  onDismiss: () => void;
  onReopen: () => void;
};

/**
 * One question in the queue. The count leads — it is why this question is
 * here before the next one — then the question in the buyer's own words, then
 * where and when it was asked. Answering opens in place, under the question.
 */
export function QuestionRow({ question, isOpen, isPending, autoFocus, draft, onDraft, onOpen, onClose, onDiscard, onAnswer, onDismiss, onReopen }: Props) {
  const t = useTranslations("org.buyerQuestions");
  const fmt = useFormatters();
  const locale = useLocale() as Locale;
  const { slug } = useParams<{ slug: string }>();
  const { car, status, askCount } = question;
  const hot = askCount >= HOT_ASKS;
  const carTitle = resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model} ${fmt.number(car.year, { useGrouping: false })}`;
  const asked = t("asked.label", { count: askCount, value: fmt.number(askCount) });

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:rounded-none sm:border-0 sm:border-t sm:px-[22px] sm:py-[18px] sm:first:border-t-0",
        isOpen && "border-2 border-inverse sm:border-0 sm:border-t sm:border-border sm:bg-[#fffaf0]",
        status === "DISMISSED" && "text-muted-foreground",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3.5">
        <span
          aria-hidden
          className={cn(
            "hidden w-16 shrink-0 flex-col items-center rounded-xl py-1.5 text-center text-micro font-semibold leading-tight sm:flex",
            hot ? "bg-[#fff1c2] text-[#8a5e00]" : "bg-muted text-muted-foreground",
          )}
        >
          <span className="text-[1.375rem] font-extrabold leading-tight text-foreground">{fmt.number(askCount)}</span>
          {t("asked.unit", { count: askCount })}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* On a phone the count is a pill above the question; on a wide screen the box above says it, so this only reads aloud. */}
          <span
            className={cn(
              "w-fit rounded-full px-2.5 py-0.5 text-micro font-bold sm:sr-only",
              hot ? "bg-[#fff1c2] text-[#8a5e00]" : "bg-muted text-muted-foreground",
            )}
          >
            {asked}
          </span>
          {/* In the buyer's language, isolated so it reads in its own direction, but lined up with the page beside its meta line. */}
          <p className={cn("text-[1.0625rem] font-semibold leading-snug", status !== "DISMISSED" && "text-foreground")}>
            <bdi>{question.question}</bdi>
          </p>
          <p className="flex flex-wrap gap-x-1.5 text-caption text-muted-foreground">
            <Link
              href={`/org/${slug}/cars/${car.id}/edit`}
              dir="auto"
              className="font-semibold text-foreground underline-offset-2 hover:underline focus-visible:underline"
            >
              {carTitle}
            </Link>
            <span>{t("lastAsked", { when: fmt.relativeToNow(question.lastAskedAt), language: t(`language.${question.locale === "ar" ? "ar" : "en"}`) })}</span>
          </p>

          {status === "ANSWERED" && !isOpen && (
            <div className="mt-2 flex flex-col gap-1 rounded-xl bg-muted/60 px-3 py-2.5">
              <span className="flex flex-wrap items-center gap-2 text-micro font-semibold text-muted-foreground">
                {t("editor.label")}
                {question.appliesToAllCars && (
                  <span className="rounded-full bg-[#e7eef8] px-2 py-px text-[#1d4e9e]">{t("allCars")}</span>
                )}
              </span>
              <p className="whitespace-pre-line text-body">
                <bdi>{question.answer}</bdi>
              </p>
            </div>
          )}
        </div>

        {!isOpen && (
          <div className="flex gap-2 sm:shrink-0">
            {status === "OPEN" && (
              <Button variant="inverse" size="control" className="h-11 flex-1 sm:h-10 sm:flex-none" disabled={isPending} onClick={onOpen}>
                {t("actions.answer")}
              </Button>
            )}
            {status === "ANSWERED" && (
              <>
                <Button variant="outline-strong" size="control" className="h-11 flex-1 border bg-field sm:h-10 sm:flex-none" disabled={isPending} onClick={onOpen}>
                  {t("actions.edit")}
                </Button>
                <Button variant="ghost" size="control" className="h-11 flex-1 sm:h-10 sm:flex-none" disabled={isPending} onClick={onReopen}>
                  {t("actions.removeAnswer")}
                </Button>
              </>
            )}
            {status === "DISMISSED" && (
              <Button variant="outline-strong" size="control" className="h-11 flex-1 border bg-field sm:h-10 sm:flex-none" disabled={isPending} onClick={onReopen}>
                {t("actions.restore")}
              </Button>
            )}
          </div>
        )}
      </div>

      {isOpen && status !== "DISMISSED" && (
        <AnswerEditor
          initial={draft ?? { answer: question.answer ?? "", allCars: question.appliesToAllCars }}
          onDraft={onDraft}
          submitLabel={status === "OPEN" ? t("actions.publish") : t("actions.save")}
          secondary={
            status === "OPEN"
              ? { label: t("actions.dismiss"), onClick: onDismiss }
              : { label: t("actions.cancel"), onClick: onDiscard }
          }
          onSubmit={onAnswer}
          onClose={onClose}
          isPending={isPending}
          autoFocus={autoFocus}
        />
      )}
    </li>
  );
}
