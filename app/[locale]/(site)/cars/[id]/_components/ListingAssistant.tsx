"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  CalendarDays,
  Car as CarIcon,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useUser } from "@clerk/nextjs";
import { carChatReturnPath, useChatDock } from "@/components/StreamChat";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import { useBuyerAccess } from "@/components/BuyerAccess";
import type { Locale } from "@/i18n/routing";
import { askListingAssistant, rateListingAssistantAnswer } from "@/actions/listing-assistant";
import { ActionErrorText } from "@/components/ActionErrorText";
import type { ActionError } from "@/lib/utils/error-messages";
import { useFormatters } from "@/hooks/use-formatters";
import type { AssistantReply, SuggestedCar } from "@/lib/services/car/listing-assistant";

const MAX_QUESTION = 300;
/** Kept in the scrolling pane; older ones drop off beyond this. */
const MAX_EXCHANGES = 20;

interface Exchange {
  id: number;
  question: string;
  reply?: AssistantReply;
  /** The server's error, kept whole so a rate limit can count down. */
  error?: { action?: ActionError };
}

const SUGGESTIONS = ["features", "hours", "mileage"] as const;

/** How many earlier exchanges travel with a question, as context. */
const HISTORY_SENT = 4;

/**
 * Buyer questions answered from what AutoMe knows about this car.
 *
 * A decline shows the model's own wording when the server passed it (see
 * declineText), otherwise fixed copy — and always the way out, the dealer
 * chat, because the point of declining is to send the buyer to someone who
 * knows.
 */
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

  /**
   * What was said so far, for the model to read a follow-up by — named by the
   * server's id for each reply; the server reads back what it said. Only real
   * replies carry one: small talk, errors and "unavailable" say nothing about
   * the car.
   */
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

function AssistantBubble({ exchange, carId }: { exchange: Exchange; carId: string }) {
  const t = useTranslations("carDetail.assistant");
  // The far side from the buyer, with its tail on the corner nearest that edge.
  const bubble = "ms-auto w-fit max-w-[85%] rounded-control rounded-ee-sm px-3 py-2 text-sm";

  if (!exchange.reply && !exchange.error) {
    // A typing indicator, not a sentence; the label is for screen readers.
    return (
      <p className={`${bubble} flex items-center gap-1 bg-muted py-3`}>
        <span className="sr-only">{t("asking")}</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </p>
    );
  }

  if (exchange.error) {
    return (
      <p className={`${bubble} bg-destructive-soft text-destructive`}>
        <ActionErrorText error={exchange.error.action} fallback={t("failed")} />
      </p>
    );
  }

  // Small talk and off-topic messages get a plain reply and no "ask the
  // dealer": there is nothing the dealer would answer.
  if (exchange.reply?.status === "smallTalk" || exchange.reply?.status === "offTopic") {
    const text =
      exchange.reply.status === "smallTalk"
        ? t(`smallTalk.${exchange.reply.kind}`)
        : exchange.reply.message || t("offTopic");
    return (
      <p className={`${bubble} bg-muted text-foreground`}>
        <span dir="auto">{text}</span>
      </p>
    );
  }

  if (exchange.reply?.status === "answered") {
    const { answer, answerId, actions = [], cars = [] } = exchange.reply;
    return (
      <div className="space-y-2">
        <p className={`${bubble} bg-muted text-foreground`}>
          <span dir="auto">{answer}</span>
        </p>
        {answerId && <AnswerRating answerId={answerId} />}
        {cars.length > 0 && (
          <ul className="ms-auto flex w-fit max-w-[85%] flex-col gap-1.5">
            {cars.map((car) => (
              <li key={car.id}>
                <SuggestedCarLink car={car} />
              </li>
            ))}
          </ul>
        )}
        {actions.length > 0 && (
          <div className="ms-auto flex w-fit max-w-[85%] flex-wrap justify-end gap-2">
            {actions.map((action) => {
              const chip =
                "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs sm:text-sm font-medium text-primary hover:bg-primary-soft transition-colors";
              if (action.kind === "testDrive") {
                // In-app: the locale-aware Link keeps the buyer's language.
                return (
                  <Link key={action.kind} href={action.href} className={chip}>
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                    {t("actions.testDrive")}
                  </Link>
                );
              }
              return (
                <a
                  key={action.kind}
                  href={action.href}
                  {...(action.kind === "directions" && { target: "_blank", rel: "noopener noreferrer" })}
                  className={chip}
                >
                  {action.kind === "directions" ? (
                    <MapPin className="w-3.5 h-3.5" aria-hidden />
                  ) : (
                    <Phone className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {action.kind === "directions" ? t("actions.directions") : t("actions.call")}
                  {/* The number itself stays left-to-right inside an Arabic label. */}
                  {action.kind === "call" && <bdi dir="ltr">{action.phone}</bdi>}
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${bubble} space-y-2 bg-marker-soft text-foreground`}>
      <p>
        <span dir="auto">
          {exchange.reply?.status === "unavailable"
            ? t("unavailable")
            : (exchange.reply?.status === "notInListing" && exchange.reply.message) ||
              t("notInListing")}
        </span>
      </p>
      <AskDealerLink carId={carId} label={t("askDealer")} />
    </div>
  );
}

/**
 * 👍 / 👎 under an answer, once. A 👎 sends the question to the dealer, who
 * can answer it properly — so the buyer is told that, not just thanked.
 * Shown as rated at once; a failed request only loses the rating.
 */
/**
 * "Ask the dealer" when the assistant cannot answer: the car's chat, opened in
 * place for a signed-in buyer; for a signed-out one, sign-in first and then
 * back to this car with the chat open (OpenChatFromLink). It used to link to
 * /messages, whose sign-in had no way back — the buyer ended on the home page.
 */
function AskDealerLink({ carId, label }: { carId: string; label: string }) {
  const { isSignedIn } = useUser();
  const { openCarChat } = useChatDock();
  const { signInTo } = useAuthRedirects();
  const { can } = useBuyerAccess();
  const className =
    "inline-flex cursor-pointer items-center gap-1.5 font-semibold text-foreground underline underline-offset-2";
  if (!can("message")) return null;
  const content = (
    <>
      <MessageCircle className="w-3.5 h-3.5" aria-hidden />
      {label}
    </>
  );

  return isSignedIn ? (
    <button type="button" onClick={() => openCarChat(carId)} className={className}>
      {content}
    </button>
  ) : (
    <Link href={signInTo(carChatReturnPath(carId))} className={className}>
      {content}
    </Link>
  );
}

function AnswerRating({ answerId }: { answerId: string }) {
  const t = useTranslations("carDetail.assistant.rating");
  const [rated, setRated] = useState<"up" | "down" | null>(null);

  const rate = (helpful: boolean) => {
    setRated(helpful ? "up" : "down");
    void rateListingAssistantAnswer({ answerId, helpful }).catch(() => undefined);
  };

  if (rated) {
    return (
      <p className="ms-auto w-fit max-w-[85%] text-xs text-muted-foreground" role="status">
        {rated === "up" ? t("thanks") : t("sentToDealer")}
      </p>
    );
  }

  const button =
    "cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground transition-colors";
  return (
    <div className="ms-auto flex w-fit items-center gap-1">
      <button type="button" onClick={() => rate(true)} className={button} aria-label={t("helpful")} title={t("helpful")}>
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button type="button" onClick={() => rate(false)} className={button} aria-label={t("notHelpful")} title={t("notHelpful")}>
        <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** One of the dealership's other cars an answer named, linking to its listing. */
function SuggestedCarLink({ car }: { car: SuggestedCar }) {
  const fmt = useFormatters();
  // A year is a label, not a quantity: no grouping ("2,020").
  const title = `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`;
  return (
    <Link
      href={`/cars/${car.id}`}
      className="flex items-center gap-3 rounded-control border border-border bg-card p-2 pe-3 hover:border-primary/30 hover:bg-primary-soft/60 transition-colors"
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {car.image ? (
          <Image src={car.image} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <CarIcon className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground/60" aria-hidden />
        )}
      </div>
      <div className="min-w-0 text-sm">
        <p className="truncate font-semibold text-foreground">{title}</p>
        <p className="text-muted-foreground">{fmt.price(car.price, car.currency)}</p>
      </div>
      <ChevronRight className="ms-auto h-4 w-4 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden />
    </Link>
  );
}

export default ListingAssistant;
