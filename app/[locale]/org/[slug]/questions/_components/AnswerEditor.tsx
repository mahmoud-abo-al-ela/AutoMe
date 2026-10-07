"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormatters } from "@/hooks/use-formatters";

/** The schema's bound: every answer is sent to the model with each question. */
const MAX_ANSWER = 500;

export type AnswerDraft = { answer: string; allCars: boolean };

type Props = {
  initial: AnswerDraft;
  /** Every change, so the text outlives the editor closing or another row opening. */
  onDraft: (draft: AnswerDraft) => void;
  submitLabel: string;
  /** The quieter action beside the submit: Dismiss for a new question, Cancel for an edit. */
  secondary: { label: string; onClick: () => void };
  onSubmit: (answer: string, appliesToAllCars: boolean) => void;
  /** Esc closes the editor; the text stays in the row until the row goes. */
  onClose: () => void;
  isPending: boolean;
  autoFocus?: boolean;
};

/**
 * The answer, written in place under the question (canvas: Buyer questions
 * round 1, "1 · Teach queue"). Ctrl/⌘+Enter publishes, for dealers clearing a
 * run of questions from the keyboard.
 */
export function AnswerEditor({
  initial,
  onDraft,
  submitLabel,
  secondary,
  onSubmit,
  onClose,
  isPending,
  autoFocus,
}: Props) {
  const t = useTranslations("org.buyerQuestions.editor");
  const fmt = useFormatters();
  const id = useId();
  const [answer, setAnswerState] = useState(initial.answer);
  const [allCars, setAllCarsState] = useState(initial.allCars);
  const setAnswer = (next: string) => {
    setAnswerState(next);
    onDraft({ answer: next, allCars });
  };
  const setAllCars = (next: boolean) => {
    setAllCarsState(next);
    onDraft({ answer, allCars: next });
  };
  const ready = answer.trim().length > 0 && !isPending;
  const submit = () => ready && onSubmit(answer.trim(), allCars);

  return (
    <div className="flex flex-col gap-2.5 sm:ms-[78px]">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-answer`} className="text-caption font-semibold">
          {t("label")}
        </label>
        <span id={`${id}-count`} className="text-micro tabular-nums text-muted-foreground">
          {t("count", { used: fmt.number(answer.length), max: fmt.number(MAX_ANSWER) })}
        </span>
      </div>
      <textarea
        id={`${id}-answer`}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            submit();
          }
        }}
        maxLength={MAX_ANSWER}
        rows={3}
        autoFocus={autoFocus}
        // Empty, it follows the page; typed, it follows the text — an empty
        // field has nothing for "auto" to judge by and would fall back to LTR.
        dir={answer ? "auto" : undefined}
        placeholder={t("placeholder")}
        aria-describedby={`${id}-count ${id}-hint`}
        className="min-h-[90px] w-full resize-y rounded-control border border-[#8c8170] bg-field px-3 py-2.5 text-body outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-caption sm:min-h-0">
          <Checkbox
            checked={allCars}
            onCheckedChange={(checked) => setAllCars(checked === true)}
            className="size-[18px] border-[#8c8170] data-[state=checked]:border-inverse data-[state=checked]:bg-inverse data-[state=checked]:text-inverse-foreground"
          />
          {t("allCars")}
        </label>
        <span aria-hidden className="hidden flex-1 sm:block" />
        <div className="flex gap-2">
          <Button
            variant="outline-strong"
            size="control"
            className="h-11 border bg-field sm:h-10"
            disabled={isPending}
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
          <Button variant="inverse" size="control" className="order-first h-11 flex-1 sm:order-none sm:h-10 sm:flex-none" disabled={!ready} onClick={submit}>
            {isPending && <Loader2 aria-hidden className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
      <p id={`${id}-hint`} className="text-caption text-muted-foreground">
        {allCars ? t("hintAll") : t("hintCar")}
      </p>
    </div>
  );
}
