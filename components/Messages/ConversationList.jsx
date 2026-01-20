"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Car, Building2, User } from "lucide-react";

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    currentUserId,
    isOrgView = false,
    orgMembers = [],
    emptyStateTitle = "No conversations yet",
    emptyStateDescription = "Start a conversation with a dealership about a car you're interested in",
}) {
    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    {isOrgView ? (
                        <User className="w-8 h-8 text-muted-foreground" />
                    ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-2">{emptyStateTitle}</h3>
                <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
                    {emptyStateDescription}
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {conversations.map((conversation) => {
                const lastMessage = conversation.messages?.[0];

                let displayInfo, isUnread;

                if (isOrgView) {
                    // For org view, show customer info
                    const customer = conversation.participants?.find(p => !orgMembers.includes(p.id));
                    displayInfo = {
                        avatar: customer?.imageUrl,
                        name: customer?.name || customer?.email || "Unknown User",
                        subtitle: customer?.email && customer?.name ? customer.email : null,
                        fallback: customer?.name?.substring(0, 2).toUpperCase() || "U",
                    };
                    isUnread = lastMessage && !orgMembers.includes(lastMessage.senderId) && !lastMessage.readAt;
                } else {
                    // For public view, show organization info
                    displayInfo = {
                        avatar: conversation.organization?.logo,
                        name: conversation.organization?.name || "Unknown Dealership",
                        subtitle: null,
                        fallback: conversation.organization?.name?.substring(0, 2).toUpperCase() || "DL",
                    };
                    isUnread = lastMessage && lastMessage.senderId !== currentUserId && !lastMessage.readAt;
                }

                return (
                    <button
                        key={conversation.id}
                        onClick={() => onSelect(conversation.id)}
                        className={cn(
                            "w-full p-3 md:p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                            selectedId === conversation.id && "bg-muted"
                        )}
                    >
                        <div className="flex gap-3">
                            <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                                <AvatarImage src={displayInfo.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {displayInfo.fallback}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn(
                                            "font-semibold text-sm truncate",
                                            isUnread && "text-primary"
                                        )}>
                                            {displayInfo.name}
                                        </h3>
                                        {displayInfo.subtitle && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {displayInfo.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    {lastMessage && (
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>

                                {conversation.car && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                                        <Car className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">
                                            {conversation.car.year} {conversation.car.make} {conversation.car.model}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                        "text-sm truncate flex-1",
                                        isUnread ? "font-medium text-foreground" : "text-muted-foreground"
                                    )}>
                                        {lastMessage?.content || "No messages yet"}
                                    </p>
                                    {isUnread && (
                                        <Badge variant="default" className="h-5 px-2 text-xs flex-shrink-0">
                                            New
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
