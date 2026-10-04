"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect, useState, Component } from "react";
import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import { useFormatters } from "@/hooks/use-formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Above this the badge shows "99+" rather than a number nobody reads. */
const CAP = 99;
import type { ChannelFilters } from "stream-chat";

type OrgUnreadBadgeProps = {
    organizationId?: string | null;
    className?: string;
};

// Error boundary to catch context errors
class OrgUnreadBadgeErrorBoundary extends Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
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
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

/**
 * Unread messages across this organization's chats, kept live from Stream's
 * events. null until the chat client is connected. Must run inside the chat
 * context — use it through OrgUnreadBadge or OrgUnreadCount, whose boundary
 * catches its absence.
 */
function useOrgUnreadCount(organizationId?: string | null): number | null {
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

    return client ? unreadCount : null;
}

function OrgUnreadBadgeInner({ organizationId, className }: OrgUnreadBadgeProps) {
    const t = useTranslations("chat");
    const { number } = useFormatters();
    const unreadCount = useOrgUnreadCount(organizationId);

    if (!unreadCount) return null;

    return (
        <Badge
            variant="destructive"
            className={cn(
                "h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
                className
            )}
        >
            {unreadCount > CAP
                ? t("badge.overflow", { max: number(CAP) })
                : number(unreadCount)}
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

function OrgUnreadCountInner({
    organizationId,
    children,
}: {
    organizationId?: string | null;
    children: (count: number | null) => React.ReactNode;
}) {
    return <>{children(useOrgUnreadCount(organizationId))}</>;
}

/**
 * The unread count as a render prop, for places that show it as part of
 * something larger (the dashboard's messages card). `children` gets null
 * while chat is still connecting, or when there is no chat context at all.
 */
export function OrgUnreadCount({
    organizationId,
    children,
}: {
    organizationId?: string | null;
    children: (count: number | null) => React.ReactNode;
}) {
    return (
        <OrgUnreadBadgeErrorBoundary fallback={children(null)}>
            <OrgUnreadCountInner organizationId={organizationId}>{children}</OrgUnreadCountInner>
        </OrgUnreadBadgeErrorBoundary>
    );
}
