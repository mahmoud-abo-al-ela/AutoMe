"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect, useState, Component } from "react";
import { useChatContext } from "stream-chat-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChannelFilters } from "stream-chat";

type OrgUnreadBadgeProps = {
    organizationId?: string | null;
    className?: string;
};

// Error boundary to catch context errors
class OrgUnreadBadgeErrorBoundary extends Component<
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

function OrgUnreadBadgeInner({ organizationId, className }: OrgUnreadBadgeProps) {
    const { client, channel: activeChannel } = useChatContext();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!client || !organizationId) return;

        const updateUnreadCount = async () => {
            try {
                // Get all channels for this organization
                // organization_id is a custom channel field, which Stream's
                // closed ChannelFilters union cannot express.
                const filter = {
                    type: "messaging",
                    organization_id: organizationId,
                    members: { $in: [client.userID] },
                } as unknown as ChannelFilters;

                const channels = await client.queryChannels(filter);

                // Calculate total unread count across all organization channels
                const totalUnread = channels.reduce((sum, channel) => {
                    return sum + (channel.countUnread() || 0);
                }, 0);

                setUnreadCount(totalUnread);
            } catch (error) {
                logError("Error updating org unread count:", error);
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
    }, [client, organizationId, activeChannel]);

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

export function OrgUnreadBadge({ organizationId, className }: OrgUnreadBadgeProps) {
    return (
        <OrgUnreadBadgeErrorBoundary>
            <OrgUnreadBadgeInner organizationId={organizationId} className={className} />
        </OrgUnreadBadgeErrorBoundary>
    );
}
