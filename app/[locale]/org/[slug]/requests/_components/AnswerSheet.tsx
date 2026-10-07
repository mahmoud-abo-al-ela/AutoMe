"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarName, type QuestionRequest } from "./RequestRows";

const MAX_ANSWER = 500;

/**
 * Answering keeps the list in view (canvas: Round 3 — Requests): a side panel
 * from the inline end, not a page or a centred modal — the task takes
 * seconds and the dealer goes straight on to the next request.
 *
 * Publish is never disabled (a second click while saving is ignored); an
 * empty answer says what is missing instead, after the first attempt (forms:
 * never mark a pristine field invalid).
 */
export function AnswerSheet({
  question,
  busy,
  onClose,
  onPublish,
}: {
  question: QuestionRequest | null;
  busy: boolean;
  onClose: () => void;
  onPublish: (input: { id: string; answer: string; appliesToAllCars: boolean }) => Promise<unknown>;
}) {
  const t = useTranslations("org.requests.answerSheet");
  const tQ = useTranslations("org.requests.question");
  const fmt = useFormatters();
  const carName = useCarName();
  const [answer, setAnswer] = useState("");
  const [allCars, setAllCars] = useState(false);
  const [tried, setTried] = useState(false);

  // A fresh form for each question.
  useEffect(() => {
    setAnswer(question?.answer ?? "");
    setAllCars(question?.appliesToAllCars ?? false);
    setTried(false);
  }, [question]);

  const missing = tried && !answer.trim();

  const publish = async () => {
    if (!question || busy) return;
    if (!answer.trim()) {
      setTried(true);
      return;
    }
    try {
      await onPublish({ id: question.id, answer: answer.trim(), appliesToAllCars: allCars });
      onClose();
    } catch {
      // The hook has shown the error; the text stays for another try.
    }
  };

  return (
    <Sheet open={!!question} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]">
        {question && (
          <>
            <div className="border-b border-border px-6 pb-4 pt-6 pe-14">
              <SheetTitle className="text-h3 font-semibold">{t("title")}</SheetTitle>
              <SheetDescription className="mt-1 text-caption text-muted-foreground">
                {tQ("about", { car: carName(question.car) })}. {tQ("asked", { count: question.askCount, value: fmt.number(question.askCount) })}
              </SheetDescription>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <blockquote dir="auto" className="rounded-control bg-muted px-4 py-3 text-[1.0625rem] font-semibold">
                {question.question}
              </blockquote>

              <div className="flex flex-col gap-2">
                <label htmlFor="request-answer" className="text-caption font-semibold">
                  {t("label")}
                </label>
                <textarea
                  id="request-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  maxLength={MAX_ANSWER}
                  rows={5}
                  // Empty, it follows the page; typed, it follows the text.
                  dir={answer ? "auto" : undefined}
                  aria-invalid={missing || undefined}
                  aria-describedby={missing ? "request-answer-error request-answer-help" : "request-answer-help"}
                  className="w-full resize-y rounded-control border border-[#8c8170] bg-field px-3 py-2.5 text-body outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
                />
                {missing && (
                  <p id="request-answer-error" className="text-caption font-semibold text-destructive">
                    {t("required")}
                  </p>
                )}
                <p id="request-answer-help" className="text-micro text-muted-foreground">
                  {t("help")}
                </p>
              </div>

              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                <Checkbox checked={allCars} onCheckedChange={(checked) => setAllCars(checked === true)} className="mt-0.5 size-5" />
                <span className="flex flex-col">
                  <span className="text-caption font-semibold">{t("allCars")}</span>
                  <span className="text-caption text-muted-foreground">{t("allCarsHint")}</span>
                </span>
              </label>
            </div>

            <div className="flex gap-3 border-t border-border px-6 py-4">
              <Button variant="marker" size="xl" onClick={publish} aria-busy={busy || undefined}>
                {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
                {t("publish")}
              </Button>
              <Button variant="ghost" size="xl" onClick={onClose}>
                {t("cancel")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
