"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/routing";
import { askListingAssistant } from "@/actions/listing-assistant";
import { AssistantBubble, type Exchange } from "./AssistantBubble";
import type { ActionError } from "@/lib/utils/error-messages";

const MAX_QUESTION = 300;
/** Kept in the scrolling pane; older ones drop off beyond this. */
const MAX_EXCHANGES = 20;

const SUGGESTIONS = ["features", "hours", "mileage"] as const;

/** How many earlier exchanges travel with a question, as context. */
const HISTORY_SENT = 4;

const ListingAssistant = ({ carId }: { carId: string }) => {
  const t = useTranslations("carDetail.assistant");
  const locale = useLocale() as Locale;
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const nextId = useRef(0);
  const paneRef = useRef<HTMLOListElement>(null);

  // Keep the newest exchange in view as questions and answers arrive.
  useEffect(() => {
    const pane = paneRef.current;
    if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
  }, [exchanges]);

  const settle = (id: number, patch: Partial<Exchange>) =>
    setExchanges((all) => all.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const historyFor = (all: Exchange[]) =>
    all
      .flatMap((e) => {
        const r = e.reply;
        return r && "replyId" in r && r.replyId ? [r.replyId] : [];
      })
      .slice(-HISTORY_SENT);

  const ask = useMutation({
    mutationFn: async ({ question, historyIds }: { id: number; question: string; historyIds: string[] }) => {
      const response = await askListingAssistant({ carId, question, locale, historyIds });
      if (!response.success) throw response.error;
      return response.data;
    },
    onSuccess: (reply, { id }) => settle(id, { reply }),
    onError: (error, { id }) =>
      settle(id, { error: { action: error as unknown as ActionError } }),
  });

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || ask.isPending) return;
    const id = nextId.current++;
    const historyIds = historyFor(exchanges);
    setExchanges((all) => [...all, { id, question: trimmed }].slice(-MAX_EXCHANGES));
    setQuestion("");
    ask.mutate({ id, question: trimmed, historyIds });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(question);
  };

  return (
    <Card className=" border-0 bg-card p-0">
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary-soft rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        {exchanges.length > 0 && (
          // Fixed height, scrolling: the page below the card does not jump as
          // the conversation grows.
          <ol
            ref={paneRef}
            className="h-72 sm:h-80 space-y-3 overflow-y-auto overscroll-contain rounded-lg bg-muted/60 p-3"
            aria-live="polite"
          >
            {exchanges.map((exchange) => (
              <li key={exchange.id} className="space-y-2">
                {/* The buyer on the reading-start side — right in Arabic, left in
                    English — and the answer on the far side; logical classes
                    mirror it with the page direction. */}
                <p className="w-fit max-w-[85%] rounded-control rounded-es-sm bg-primary px-3 py-2 text-sm text-white">
                  <span className="sr-only">{t("you")}: </span>
                  {/* dir="auto" on the text, not the bubble: a question typed in
                      the other language keeps its own direction, while the
                      bubble's side and tail still follow the page. */}
                  <span dir="auto">{exchange.question}</span>
                </p>
                <AssistantBubble exchange={exchange} carId={carId} />
              </li>
            ))}
          </ol>
        )}

        {exchanges.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => submit(t(`suggestions.${key}`))}
                className="cursor-pointer rounded-full border border-primary/30 bg-primary-soft px-3 py-1.5 text-xs sm:text-sm text-primary hover:bg-primary-soft transition-colors"
              >
                {t(`suggestions.${key}`)}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={MAX_QUESTION}
            placeholder={t("placeholder")}
            aria-label={t("inputLabel")}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={ask.isPending || question.trim().length < 2}
            className="cursor-pointer shrink-0"
          >
            {ask.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Send className="w-4 h-4 rtl:-scale-x-100" aria-hidden />
            )}
            <span className="sr-only sm:not-sr-only">{t("ask")}</span>
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
};

export default ListingAssistant;
