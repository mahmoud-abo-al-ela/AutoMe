"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import type { Channel as StreamChannel } from "stream-chat";

/** Above this the dot shows "9+" — it is 20px across. */
const CAP = 9;

export function UserChannelPreview({
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
    const isActive = activeChannel?.id === channel.id;
    const unreadCount = channel.countUnread();

    // Get car info from channel data
    const carData = channel.data?.car_data;
    const organizationData = channel.data?.organization_data;

    // Determine display info - prefer car data, fallback to organization
    const displayTitle =
        carData?.title || organizationData?.name || t("window.untitled");
    const displayImage = carData?.images?.[0] || carData?.image;
    const isCar = !!carData;

    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    const lastMessageTime = lastMessage?.created_at;

    const { messageTimestamp: formatTime, number } = useFormatters();

    // Get last message preview
    const getMessagePreview = () => {
        if (!lastMessage) return t("preview.noMessages");

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
            {/* Avatar - Car Image or Organization Icon */}
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12 ring-2 ring-background rounded-lg">
                    {displayImage ? (
                        <AvatarImage
                            src={displayImage}
                            alt={displayTitle}
                            className="object-cover"
                        />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 rounded-lg">
                        {isCar ? (
                            <Car className="h-6 w-6 text-primary" />
                        ) : (
                            <Building2 className="h-6 w-6 text-primary" />
                        )}
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

            {/* Content */}
            <div className="flex-1 min-w-0 text-start">
                {/* Top row: Title and Time */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                        "font-semibold text-sm truncate",
                        unreadCount > 0 && "text-foreground"
                    )}>
                        {displayTitle}
                    </h4>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(lastMessageTime)}
                    </span>
                </div>

                {/* Last message preview */}
                <p className={cn(
                    "text-sm truncate",
                    unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                    {getMessagePreview()}
                </p>
            </div>
        </button>
    );
}
