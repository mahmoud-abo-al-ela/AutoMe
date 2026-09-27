"use client";

import { useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { askListingAssistant } from "@/actions/listing-assistant";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import type { AssistantReply } from "@/lib/services/car/listing-assistant";

const MAX_QUESTION = 300;
/** Older exchanges scroll off: this is a quick answer, not a chat history. */
const MAX_EXCHANGES = 4;

interface Exchange {
  id: number;
  question: string;
  reply?: AssistantReply;
  error?: string;
}

const SUGGESTIONS = ["features", "hours", "mileage"] as const;

/**
 * Buyer questions answered from this listing only.
 *
 * Only an `answered` reply shows model text. A decline and an unavailable
 * assistant show fixed copy with the way out — the dealer chat — because the
 * point of declining is to send the buyer to someone who knows.
 */
const ListingAssistant = ({ carId }: { carId: string }) => {
  const t = useTranslations("carDetail.assistant");
  const locale = useLocale() as Locale;
  const actionError = useActionError();
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const nextId = useRef(0);

  const settle = (id: number, patch: Partial<Exchange>) =>
    setExchanges((all) => all.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const ask = useMutation({
    mutationFn: async ({ question }: { id: number; question: string }) => {
      const response = await askListingAssistant({ carId, question, locale });
      if (!response.success) throw response.error;
      return response.data;
    },
    onSuccess: (reply, { id }) => settle(id, { reply }),
    onError: (error, { id }) =>
      settle(id, { error: actionError(error as unknown as ActionError, t("failed")) }),
  });

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || ask.isPending) return;
    const id = nextId.current++;
    setExchanges((all) => [...all, { id, question: trimmed }].slice(-MAX_EXCHANGES));
    setQuestion("");
    ask.mutate({ id, question: trimmed });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(question);
  };

  return (
    <Card className="shadow-lg border-0 bg-white p-0">
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-violet-100 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{t("title")}</h3>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {exchanges.length > 0 && (
          <ol className="space-y-3" aria-live="polite">
            {exchanges.map((exchange) => (
              <li key={exchange.id} className="space-y-2">
                <p className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-ee-sm bg-blue-600 px-3 py-2 text-sm text-white">
                  <span className="sr-only">{t("you")}: </span>
                  {exchange.question}
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
                className="cursor-pointer rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs sm:text-sm text-violet-700 hover:bg-violet-100 transition-colors"
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

        <p className="text-xs text-gray-400">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
};

function AssistantBubble({ exchange, carId }: { exchange: Exchange; carId: string }) {
  const t = useTranslations("carDetail.assistant");
  const bubble = "w-fit max-w-[85%] rounded-2xl rounded-es-sm px-3 py-2 text-sm";

  if (!exchange.reply && !exchange.error) {
    return (
      <p className={`${bubble} flex items-center gap-2 bg-gray-100 text-gray-500`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        {t("asking")}
      </p>
    );
  }

  if (exchange.error) {
    return <p className={`${bubble} bg-red-50 text-red-700`}>{exchange.error}</p>;
  }

  if (exchange.reply?.status === "answered") {
    return (
      <div className={`${bubble} bg-gray-100 text-gray-800`}>
        <span className="mb-0.5 block text-micro font-semibold uppercase tracking-wide text-violet-600">
          {t("fromListing")}
        </span>
        {exchange.reply.answer}
      </div>
    );
  }

  return (
    <div className={`${bubble} space-y-2 bg-amber-50 text-amber-900`}>
      <p>{exchange.reply?.status === "unavailable" ? t("unavailable") : t("notInListing")}</p>
      {/* Middleware sends a signed-out buyer through sign-in and back. */}
      <Link
        href={`/messages?carId=${carId}`}
        className="inline-flex items-center gap-1.5 font-semibold text-amber-900 underline underline-offset-2"
      >
        <MessageCircle className="w-3.5 h-3.5" aria-hidden />
        {t("askDealer")}
      </Link>
    </div>
  );
}

export default ListingAssistant;
