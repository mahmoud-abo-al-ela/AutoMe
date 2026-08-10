"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect, useState } from "react";
import { ChannelList } from "stream-chat-react";
import { useChatContext } from "stream-chat-react";
import { getOrganizationMemberIds } from "@/actions/stream-chat";
import { Loader2, MessageSquare } from "lucide-react";
import { DMChannelPreview } from "./DMChannelPreview";
import type { ChannelFilters, ChannelSort } from "stream-chat";

export function OrganizationChannelList({
    organizationSlug,
}: {
    organizationSlug: string;
}) {
    const { client } = useChatContext();
    const [filters, setFilters] = useState<ChannelFilters | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const result = await getOrganizationMemberIds(organizationSlug);

                if (result.success) {
                    const { memberIds, organizationId } = result.data;

                    // Filter channels where organization members are participants
                    // organization_id is a custom channel field, outside
                    // Stream's closed ChannelFilters union.
                    setFilters({
                        type: "messaging",
                        members: { $in: memberIds },
                        organization_id: organizationId,
                    } as unknown as ChannelFilters);
                }
            } catch (error) {
                logError("Error loading organization channels:", error);
            } finally {
                setLoading(false);
            }
        };

        if (client?.userID && organizationSlug) {
            loadFilters();
        }
    }, [client, organizationSlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!filters) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Unable to load conversations
            </div>
        );
    }

    const sort: ChannelSort = { last_message_at: -1 };
    const options = { limit: 20 };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-background shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg">Customer Messages</h2>
                </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-hidden">
                <ChannelList
                    filters={filters}
                    sort={sort}
                    options={options}
                    Preview={(props) => (
                        <DMChannelPreview
                            channel={props.channel}
                            setActiveChannel={props.setActiveChannel}
                            activeChannel={props.activeChannel}
                        />
                    )}
                    setActiveChannelOnMount={false}
                />
            </div>
        </div>
    );
}
