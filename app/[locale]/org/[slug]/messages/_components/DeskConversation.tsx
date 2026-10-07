"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Channel, MessageInput, MessageList, Thread, Window, useChatContext, type SendButtonProps } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { ArrowLeft, CarFront, MessageSquare } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePriceVerdictText } from "@/components/brand/FairPriceGauge";
import { ChatMessage } from "@/components/StreamChat/ChatMessage";
import { ChatMessageStatus } from "@/components/StreamChat/ChatMessageStatus";
import { NoAttachmentSelector } from "@/components/StreamChat/no-attachments";
import { useConversationSide } from "@/components/StreamChat/ConversationHeader";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { logError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils";
import { BuyerAvatar } from "./desk-shared";
import { DealPanel, useDeal } from "./DealPanel";
import { compose, testDriveLink } from "./compose";

const VERDICT_TONE = { below: "text-price-below", above: "text-price-above", fair: "text-muted-foreground", unknown: "text-muted-foreground" } as const;

/**
 * The open conversation in the desk's middle column: who it is with, the car
 * (as a strip with "The deal" where the side column is not shown), Stream's
 * message list — the buyer on the reading start side, the dealership on the
 * end side, mirrored with the page direction — quick replies, and the box.
 */
export function DeskConversation({ base }: { base: string }) {
  const t = useTranslations("org.messages");
  const { channel } = useChatContext();

  // Opening a conversation reads it.
  useEffect(() => {
    channel?.markRead().catch((error) => logError("Marking the conversation read failed", error));
  }, [channel]);

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-2">
          <span aria-hidden className="mb-2 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="size-7" />
          </span>
          <p className="text-body font-semibold">{t("pick.title")}</p>
          <p className="text-caption text-muted-foreground">{t("pick.body")}</p>
        </div>
      </div>
    );
  }

  return (
    <Channel
      channel={channel}
      markReadOnMount={false}
      Message={ChatMessage}
      AttachmentSelector={NoAttachmentSelector}
      MessageStatus={ChatMessageStatus}
      SendButton={DeskSendButton}
    >
      <Window>
        <DeskHeader channel={channel} base={base} />
        <MessageList />
        <QuickReplies channel={channel} />
        <MessageInput additionalTextareaProps={{ placeholder: t("composer.placeholder") }} />
      </Window>
      <Thread />
    </Channel>
  );
}

function DeskHeader({ channel, base }: { channel: StreamChannel; base: string }) {
  const t = useTranslations("org.messages");
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const { setActiveChannel } = useChatContext();
  const { buyer } = useConversationSide(channel);
  const deal = useDeal(channel).data;
  const verdict = usePriceVerdictText(deal?.market?.percent ?? null);
  const [dealOpen, setDealOpen] = useState(false);
  const wide = useWide();
  const name = buyer?.name || t("row.unknownBuyer");
  const car = deal?.car;
  const carName = car ? (resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model}`) : null;

  return (
    <div className="shrink-0 border-b border-border bg-card">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setActiveChannel(undefined)}
          aria-label={t("header.back")}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-muted lg:hidden"
        >
          <ArrowLeft aria-hidden className="size-5 rtl:-scale-x-100" />
        </button>
        <BuyerAvatar name={name} image={buyer?.image} className="size-10" />
        <p className="min-w-0 flex-1 truncate text-body font-semibold">{name}</p>
      </div>

      {/* Where the deal column is not shown, the car rides in a strip that opens it. */}
      {car && (
        <div className="flex items-center gap-3 border-t border-border px-3 py-2 xl:hidden sm:px-4">
          <span className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-muted">
            {car.image ? <Image src={car.image} alt="" fill sizes="56px" className="object-cover" /> : <CarFront aria-hidden className="size-4 text-muted-foreground" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-caption">
            <span dir="auto" className="truncate font-semibold">{carName}</span>
            <span className="truncate">
              <span className="tabular-nums">{fmt.price(car.price, car.priceCurrency)}</span>{" "}
              <span className={cn("font-semibold", VERDICT_TONE[verdict.verdict])}>{verdict.text}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => setDealOpen(true)}
            className="h-9 shrink-0 cursor-pointer rounded-full border border-[#8c8170] bg-field px-3.5 text-caption font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t("header.deal")}
          </button>
          <Sheet open={dealOpen} onOpenChange={setDealOpen}>
            <SheetContent side={wide ? "right" : "bottom"} className={cn("flex flex-col gap-0 bg-card p-0", wide ? "w-[380px] sm:max-w-[380px]" : "max-h-[88dvh] rounded-t-sheet")}>
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle className="text-body font-semibold">{t("header.dealFor", { car: carName ?? "" })}</SheetTitle>
              </SheetHeader>
              <DealPanel channel={channel} base={base} className="flex-1" />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

/** Replies a dealer types ten times a day, one tap into the box — to edit and send, never sent for them. */
function QuickReplies({ channel }: { channel: StreamChannel }) {
  const t = useTranslations("org.messages.quick");
  const carId = channel.data?.car_data?.id ?? (channel.data?.car_id as string | undefined);
  const replies = [
    { label: t("availableLabel"), text: t("available") },
    { label: t("visitLabel"), text: t("visit") },
    ...(carId ? [{ label: t("testDriveLabel"), text: t("testDrive", { link: testDriveLink(carId) }) }] : []),
  ];

  return (
    <div role="group" aria-label={t("label")} className="flex shrink-0 gap-2 overflow-x-auto bg-card px-3 pt-2.5 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
      {replies.map((reply) => (
        <button
          key={reply.label}
          type="button"
          onClick={() => compose(channel, reply.text)}
          className="h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-dashed border-[#8c8170] bg-field px-3.5 text-caption font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}

/** The desk's Send: a word, not an icon, in marker yellow — the one action of the screen. */
function DeskSendButton({ sendMessage, ...rest }: SendButtonProps) {
  const t = useTranslations("org.messages.composer");
  return (
    <button
      {...rest}
      type="button"
      onClick={sendMessage}
      aria-label={t("send")}
      className="h-12 shrink-0 cursor-pointer rounded-control border-2 border-border-strong bg-marker px-5 text-body font-semibold text-marker-foreground shadow-key transition-colors hover:bg-marker-hover active:translate-y-0.5 active:shadow-key-pressed disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
    >
      {t("send")}
    </button>
  );
}

/** Tablet and up: the deal opens from the side; on a phone, from the bottom. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}
