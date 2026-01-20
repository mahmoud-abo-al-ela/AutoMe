"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Car, Building2 } from "lucide-react";
import { useChatContext } from "stream-chat-react";
import { cn } from "@/lib/utils";

export function DMChannelPreview({ channel, setActiveChannel, activeChannel }) {
    const { client } = useChatContext();
    const isActive = activeChannel?.id === channel.id;
    const unreadCount = channel.countUnread();

    // Get the other user in the conversation (not the current user)
    const members = Object.values(channel.state.members);
    const otherMember = members.find((member) => member.user.id !== client.userID);
    const otherUser = otherMember?.user;

    // Get car info from channel data
    const carData = channel.data?.car_data;
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    const lastMessageTime = lastMessage?.created_at;

    // Format time
    const formatTime = (date) => {
        if (!date) return "";
        const now = new Date();
        const messageDate = new Date(date);
        const diffInHours = (now - messageDate) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return messageDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } else if (diffInHours < 168) {
            return messageDate.toLocaleDateString("en-US", { weekday: "short" });
        } else {
            return messageDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
    };

    // Get last message preview
    const getMessagePreview = () => {
        if (!lastMessage) return "No messages yet";

        const isCurrentUser = lastMessage.user?.id === client.userID;
        const prefix = isCurrentUser ? "You: " : "";
        const text = lastMessage.text || "Sent an attachment";

        return prefix + text;
    };

    return (
        <button
            onClick={() => setActiveChannel(channel)}
            className={cn(
                "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer",
                isActive && "bg-muted"
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-12 w-12 ring-2 ring-background">
                    {otherUser?.image ? (
                        <AvatarImage src={otherUser.image} alt={otherUser.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
                {/* Top row: Name and Time */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                        "font-semibold text-sm truncate",
                        unreadCount > 0 && "text-foreground"
                    )}>
                        {otherUser?.name || "Unknown User"}
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
