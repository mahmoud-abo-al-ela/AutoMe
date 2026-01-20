"use client";

import { useEffect, useState, Component } from "react";
import { useChatContext } from "stream-chat-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Error boundary to catch context errors
class UnreadBadgeErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Silently catch - this is expected when chat context is not available
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

function UnreadBadgeInner({ className }) {
    const { client } = useChatContext();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!client) return;

        const updateUnreadCount = async () => {
            try {
                // Query all channels for the user
                const filters = {
                    type: "messaging",
                    members: { $in: [client.userID] },
                };

                const channels = await client.queryChannels(filters, { last_message_at: -1 }, { limit: 100 });

                // Calculate total unread count across all channels
                const totalUnread = channels.reduce((sum, channel) => {
                    return sum + (channel.countUnread() || 0);
                }, 0);

                setUnreadCount(totalUnread);
            } catch (error) {
                console.error("Error updating unread count:", error);
            }
        };

        updateUnreadCount();

        // Listen for new messages and read events
        client.on("message.new", updateUnreadCount);
        client.on("message.read", updateUnreadCount);
        client.on("notification.message_new", updateUnreadCount);
        client.on("notification.mark_read", updateUnreadCount);
        client.on("notification.mark_unread", updateUnreadCount);

        return () => {
            client.off("message.new", updateUnreadCount);
            client.off("message.read", updateUnreadCount);
            client.off("notification.message_new", updateUnreadCount);
            client.off("notification.mark_read", updateUnreadCount);
            client.off("notification.mark_unread", updateUnreadCount);
        };
    }, [client]);

    if (!client || unreadCount === 0) return null;

    return (
        <Badge
            variant="destructive"
            className={cn(
                "h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
                className
            )}
        >
            {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
    );
}

export function UnreadBadge({ className }) {
    return (
        <UnreadBadgeErrorBoundary>
            <UnreadBadgeInner className={className} />
        </UnreadBadgeErrorBoundary>
    );
}
