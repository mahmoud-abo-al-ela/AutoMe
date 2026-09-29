"use client";

import { ChannelList } from "stream-chat-react";
import { useChatContext } from "stream-chat-react";
import { UserChannelPreview } from "./UserChannelPreview";
import { useInboxTabs } from "./useInboxTabs";
import type { ChannelFilters, ChannelSort } from "stream-chat";

const buildFilters = (userId: string, organizationId?: string | null) => {
    // organization_id is a custom channel field, outside Stream's closed
    // ChannelFilters union.
    const filters: Record<string, unknown> = {
        type: "messaging",
        members: { $in: [userId] },
    };

    // On subdomain: only show channels for this organization
    if (organizationId) {
        filters.organization_id = organizationId;
    }

    return filters as unknown as ChannelFilters;
};

const sort: ChannelSort = { last_message_at: -1 };
const options = { limit: 20 };

export function UserChannelList({
    organizationId,
}: {
    organizationId?: string | null;
}) {
    const { client } = useChatContext();
    const { tabs, channelRenderFilterFn, EmptyStateIndicator } = useInboxTabs();

    if (!client?.userID) {
        return null;
    }

    const filters = buildFilters(client.userID, organizationId);

    return (
        <div className="flex h-full flex-col">
            {tabs}
            <div className="min-h-0 flex-1">
            <ChannelList
                filters={filters}
                sort={sort}
                options={options}
                Preview={UserChannelPreview}
                channelRenderFilterFn={channelRenderFilterFn}
                EmptyStateIndicator={EmptyStateIndicator}
                setActiveChannelOnMount={false}
                showChannelSearch
                additionalChannelSearchProps={{
                    searchForChannels: true,
                    searchQueryParams: {
                        channelFilters: {
                            filters,
                        },
                    },
                }}
            />
            </div>
        </div>
    );
}
