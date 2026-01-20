"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUnreadCount } from "@/actions/messages";

export function UnreadBadge({ className }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            const result = await getUnreadCount();
            if (result.success) {
                setCount(result.data);
            }
        };

        fetchCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchCount, 30000);

        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <Badge
            variant="destructive"
            className={cn(
                "h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
                className
            )}
        >
            {count > 99 ? "99+" : count}
        </Badge>
    );
}

export function AdminUnreadBadge({ organizationSlug, className }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            const { getOrgConversations } = await import("@/actions/messages");
            const result = await getOrgConversations(organizationSlug);

            if (result.success) {
                // Count unread messages
                const unreadCount = result.data.reduce((total, conv) => {
                    const lastMessage = conv.messages[0];
                    if (lastMessage && !lastMessage.readAt) {
                        return total + 1;
                    }
                    return total;
                }, 0);
                setCount(unreadCount);
            }
        };

        if (organizationSlug) {
            fetchCount();

            // Refresh every 30 seconds
            const interval = setInterval(fetchCount, 30000);

            return () => clearInterval(interval);
        }
    }, [organizationSlug]);

    if (count === 0) return null;

    return (
        <Badge
            variant="destructive"
            className={cn(
                "h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full",
                className
            )}
        >
            {count > 99 ? "99+" : count}
        </Badge>
    );
}
