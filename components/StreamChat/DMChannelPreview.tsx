"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import { currentFlag } from "@/lib/utils/chat-moderation";
import { useCarTitle } from "@/hooks/use-car-title";
import type { Channel as StreamChannel } from "stream-chat";
import { useConversationSide } from "./ConversationHeader";

/** Above this the dot shows "9+" — it is 20px across. */
const CAP = 9;

/**
 * A conversation in the dealer's inbox: which car, which buyer, the last
 * message. The car comes first — a dealership with forty cars reads its inbox
 * by car — so its photo is the avatar and its title sits under the buyer's
 * name. The buyer is the conversation's creator, not "the first other
 * member", which with several staff on a channel could be a colleague.
 */
export function DMChannelPreview({
    channel,
    setActiveChannel,
    activeChannel,
}: {
    channel: StreamChannel;
    setActiveChannel?: (channel: StreamChannel) => void;
    activeChannel?: StreamChannel | null;
}) {
    const t = useTranslations("chat");
    const { client } = useChatContext();
    const { buyer, other } = useConversationSide(channel);
    const person = buyer ?? other;
    const isActive = activeChannel?.cid === channel.cid;
    const unreadCount = channel.countUnread();

    const carData = channel.data?.car_data;
    const carImage = carData?.images?.[0] || carData?.image;
    // Live, in the reader's language; the channel's saved title is English only.
    const carTitle = useCarTitle(carData?.id ?? channel.data?.car_id, carData?.title ?? "");
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];

    const { messageTimestamp: formatTime, number } = useFormatters();

    const getMessagePreview = () => {
        if (!lastMessage) return t("preview.noMessages");

        // An abusive message stays hidden in the list too (MessageSafety).
        const mine = lastMessage.user?.id === client.userID;
        if (!mine && currentFlag(lastMessage.safety_flag, lastMessage.text?.trim() ?? "") === "abuse") {
            return t("safety.hiddenPreview");
        }
        const text = lastMessage.text || t("preview.attachment");
        // The prefix is part of the message rather than concatenated: in
        // Arabic it is a different word in a different place.
        return lastMessage.user?.id === client.userID
            ? t("preview.ownPrefix", { text })
            : text;
    };

    return (
        <button
            onClick={() => setActiveChannel?.(channel)}
            className={cn(
                "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer",
                isActive && "bg-muted"
            )}
        >
            <div className="relative shrink-0">
                <Avatar className={cn("h-12 w-12", carData && "rounded-lg")}>
                    {carImage ? (
                        <AvatarImage src={carImage} alt="" className="object-cover" />
                    ) : person?.image ? (
                        <AvatarImage src={person.image} alt="" />
                    ) : null}
                    <AvatarFallback className={cn("bg-primary/10", carData && "rounded-lg")}>
                        {carData ? <Car className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-primary" />}
                    </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-micro font-bold text-primary-foreground">
                            {unreadCount > CAP
                                ? t("badge.overflow", { max: number(CAP) })
                                : number(unreadCount)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 text-start">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={cn("font-semibold text-sm truncate", unreadCount > 0 && "text-foreground")}>
                        {person?.name || t("preview.unknownUser")}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(lastMessage?.created_at)}
                    </span>
                </div>

                {carTitle.title && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Car className="h-3 w-3 shrink-0" aria-hidden />
                        {carTitle.loading ? (
                            <span className="block h-3 w-28 animate-pulse rounded bg-muted" aria-hidden />
                        ) : (
                            <span className="truncate" dir={carTitle.dir}>{carTitle.title}</span>
                        )}
                    </p>
                )}

                <p
                    className={cn(
                        "mt-0.5 text-sm truncate",
                        unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                >
                    {getMessagePreview()}
                </p>
            </div>
        </button>
    );
}
