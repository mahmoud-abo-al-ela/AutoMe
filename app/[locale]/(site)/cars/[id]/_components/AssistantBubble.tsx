"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  CalendarDays,
  Car as CarIcon,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useUser } from "@clerk/nextjs";
import { carChatReturnPath, useChatDock } from "@/components/StreamChat";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import { useBuyerAccess } from "@/components/BuyerAccess";
import { rateListingAssistantAnswer } from "@/actions/listing-assistant";
import { ActionErrorText } from "@/components/ActionErrorText";
import type { ActionError } from "@/lib/utils/error-messages";
import { useFormatters } from "@/hooks/use-formatters";
import type { AssistantReply, SuggestedCar } from "@/lib/services/car/listing-assistant";

/** One question and what came back: the answer, a decline, or the error. */
export interface Exchange {
  id: number;
  question: string;
  reply?: AssistantReply;
  /** The server's error, kept whole so a rate limit can count down. */
  error?: { action?: ActionError };
}

export function AssistantBubble({ exchange, carId }: { exchange: Exchange; carId: string }) {
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
