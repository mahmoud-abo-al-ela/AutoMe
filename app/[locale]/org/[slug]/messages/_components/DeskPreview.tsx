"use client";

import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarTitle } from "@/hooks/use-car-title";
import { currentFlag } from "@/lib/utils/chat-moderation";
import { useConversationSide } from "@/components/StreamChat/ConversationHeader";
import { cn } from "@/lib/utils";
import { BuyerAvatar } from "./desk-shared";

/** The buyer had the last word: the conversation is waiting on the dealership. */
export function waitingOnDealer(channel: StreamChannel) {
  const last = channel.state.messages.at(-1);
  const buyerId = channel.data?.created_by?.id;
  return !!last && !!buyerId && last.user?.id === buyerId;
}

/**
 * A conversation in the desk's list: the buyer, the car they are asking
 * about, the last message — bold while it is theirs and unanswered — and how
 * long they have been waiting, in amber, since that is what costs the sale.
 */
export function DeskPreview({
  channel,
  setActiveChannel,
  activeChannel,
}: {
  channel: StreamChannel;
  setActiveChannel?: (channel: StreamChannel) => void;
  activeChannel?: StreamChannel | null;
}) {
  const t = useTranslations("org.messages");
  const tChat = useTranslations("chat");
  const fmt = useFormatters();
  const { client } = useChatContext();
  const { buyer } = useConversationSide(channel);
  const active = activeChannel?.cid === channel.cid;
  const waiting = waitingOnDealer(channel);
  const unread = channel.countUnread();
  const car = channel.data?.car_data;
  const carTitle = useCarTitle(car?.id ?? channel.data?.car_id, car?.title ?? "");
  const last = channel.state.messages.at(-1);
  const name = buyer?.name || t("row.unknownBuyer");

  const preview = (() => {
    if (!last) return tChat("preview.noMessages");
    const mine = last.user?.id === client.userID;
    // An abusive message stays hidden in the list too (MessageSafety).
    if (!mine && currentFlag(last.safety_flag, last.text?.trim() ?? "") === "abuse") return tChat("safety.hiddenPreview");
    const text = last.text || tChat("preview.attachment");
    return last.user?.id !== channel.data?.created_by?.id ? tChat("preview.ownPrefix", { text }) : text;
  })();

  return (
    <button
      type="button"
      onClick={() => setActiveChannel?.(channel)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative flex w-full cursor-pointer items-start gap-3 border-b border-border px-4 py-3 text-start transition-colors",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50",
        active ? "bg-marker-soft before:absolute before:inset-y-0 before:start-0 before:w-1 before:bg-border-strong" : "hover:bg-muted/50",
      )}
    >
      <BuyerAvatar name={name} image={buyer?.image} carImage={car?.images?.[0] ?? car?.image} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-body", waiting || unread > 0 ? "font-semibold" : "font-medium")}>{name}</span>
          <span className={cn("shrink-0 text-micro", waiting ? "font-semibold text-[#8a5e00]" : "text-muted-foreground")}>
            {waiting && last?.created_at
              ? t("row.waiting", { time: fmt.relativeToNow(last.created_at) })
              : fmt.messageTimestamp(last?.created_at)}
          </span>
        </span>
        {carTitle.title && (
          <span dir={carTitle.dir} className="truncate text-micro text-muted-foreground">
            {carTitle.title}
          </span>
        )}
        <span dir="auto" className={cn("truncate text-caption", waiting ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {preview}
        </span>
      </span>
      {unread > 0 && <span aria-hidden className="mt-2 size-2.5 shrink-0 rounded-full bg-[#1d4e9e]" />}
    </button>
  );
}
