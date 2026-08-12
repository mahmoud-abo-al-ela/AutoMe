"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect, useState, Component } from "react";
import { useChatContext } from "stream-chat-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UnreadBadgeProps = {
    className?: string;
    organizationId?: string | null;
};

// Error boundary to catch context errors
class UnreadBadgeErrorBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Silently catch - this is expected when chat context is not available
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

function UnreadBadgeInner({ className, organizationId }: UnreadBadgeProps) {
    const { client } = useChatContext();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!client) return;

        const updateUnreadCount = async () => {
            try {
                // Query channels for the user, optionally scoped to organization
                // Stream types channel filters as a closed union of its own
                // operators; `organization_id` is a custom field this app sets
                // on channels, which that union has no way to know about.
                const filters: Record<string, unknown> = {
                    type: "messaging",
                    members: { $in: [client.userID] },
                };

                // On subdomain: only count unread from this organization's channels
                if (organizationId) {
                    filters.organization_id = organizationId;
                }

                const channels = await client.queryChannels(filters, { last_message_at: -1 }, { limit: 100 });

                // Calculate total unread count across all channels
                const totalUnread = channels.reduce((sum, channel) => {
                    return sum + (channel.countUnread() || 0);
                }, 0);

                setUnreadCount(totalUnread);
            } catch (error) {
                logError("Error updating unread count:", error);
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
    }, [client, organizationId]);

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

export function UnreadBadge({ className, organizationId }: UnreadBadgeProps) {
    return (
        <UnreadBadgeErrorBoundary>
            <UnreadBadgeInner className={className} organizationId={organizationId} />
        </UnreadBadgeErrorBoundary>
    );
}
