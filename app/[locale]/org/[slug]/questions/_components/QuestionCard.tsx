"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CarFront, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { useFormatters } from "@/hooks/use-formatters";
import type { InboxQuestion } from "./BuyerQuestionsPresenter";

const MAX_ANSWER = 500;

type Props = {
  question: InboxQuestion;
  isPending: boolean;
  onAnswer: (input: { id: string; answer: string; appliesToAllCars: boolean }) => Promise<unknown>;
  onDismiss: (id: string) => void;
  onReopen: (id: string) => void;
};

/**
 * One buyer question. Open questions show the answer form directly — the
 * point of the inbox is to answer, not to click into things. An answered one
 * shows the answer the assistant is now citing, and can be edited in place.
 */
export function QuestionCard({ question, isPending, onAnswer, onDismiss, onReopen }: Props) {
  const t = useTranslations("org.buyerQuestions");
  const fmt = useFormatters();
  const locale = useLocale() as Locale;
  const { slug } = useParams<{ slug: string }>();
  const [editing, setEditing] = useState(question.status === "OPEN");
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [allCars, setAllCars] = useState(question.appliesToAllCars);

  const car = question.car;
  const carTitle =
    resolveCarTitle(car, locale)?.text ?? `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`;

  const save = async () => {
    try {
      await onAnswer({ id: question.id, answer: answer.trim(), appliesToAllCars: allCars });
      setEditing(false);
    } catch {
      // The hook has already shown the error; keep the form open with the text.
    }
  };

  return (
    <article className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* The buyer's language, not the dashboard's. */}
        <p dir="auto" className="font-medium text-foreground">
          {question.question}
        </p>
        <Badge variant="secondary" className="tabular-nums shrink-0">
          {t("askedTimes", { count: question.askCount, value: fmt.number(question.askCount) })}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Link
          href={`/org/${slug}/cars/${car.id}/edit`}
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
        >
          <CarFront className="h-3.5 w-3.5" aria-hidden />
          {carTitle}
        </Link>
        <span>{t("lastAsked", { when: fmt.relativeToNow(question.lastAskedAt) })}</span>
        <span>{t(`askedIn.${question.locale === "ar" ? "ar" : "en"}`)}</span>
      </div>

      {question.status === "ANSWERED" && !editing && (
        <div className="rounded-md bg-muted/60 p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {t("yourAnswer")}
            {question.appliesToAllCars && <Badge variant="outline">{t("allCarsBadge")}</Badge>}
          </div>
          <p dir="auto" className="text-sm whitespace-pre-line">
            {question.answer}
          </p>
        </div>
      )}

      {editing && question.status !== "DISMISSED" && (
        <div className="space-y-2">
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={MAX_ANSWER}
            rows={3}
            // "auto" only once there is text: an empty field has nothing to judge by
            // (the placeholder does not count), so "auto" fell back to LTR and the
            // Arabic page showed its placeholder and caret on the left. Empty, it
            // follows the page; typed, it follows the text.
            dir={answer ? "auto" : undefined}
            placeholder={t("answerPlaceholder")}
            aria-label={t("answerLabel")}
          />
          <div className="flex items-start gap-2">
            <Checkbox
              id={`all-cars-${question.id}`}
              checked={allCars}
              onCheckedChange={(checked) => setAllCars(checked === true)}
            />
            <div className="grid gap-0.5">
              <Label htmlFor={`all-cars-${question.id}`} className="cursor-pointer text-sm">
                {t("allCarsLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("allCarsHint")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}

        {question.status === "OPEN" && (
          <>
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => onDismiss(question.id)}>
              {t("actions.dismiss")}
            </Button>
            <Button size="sm" disabled={isPending || !answer.trim()} onClick={save}>
              {t("actions.answer")}
            </Button>
          </>
        )}

        {question.status === "ANSWERED" &&
          (editing ? (
            <>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setEditing(false)}>
                {t("actions.cancel")}
              </Button>
              <Button size="sm" disabled={isPending || !answer.trim()} onClick={save}>
                {t("actions.save")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => onReopen(question.id)}>
                {t("actions.removeAnswer")}
              </Button>
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => setEditing(true)}>
                {t("actions.edit")}
              </Button>
            </>
          ))}

        {question.status === "DISMISSED" && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={() => onReopen(question.id)}>
            {t("actions.restore")}
          </Button>
        )}
      </div>
    </article>
  );
}
