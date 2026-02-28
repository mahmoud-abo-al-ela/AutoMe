"use client";

import { ChannelList } from "stream-chat-react";
import { useChatContext } from "stream-chat-react";
import { UserChannelPreview } from "./UserChannelPreview";

const buildFilters = (userId, organizationId) => {
    const filters = {
        type: "messaging",
        members: { $in: [userId] },
    };

    // On subdomain: only show channels for this organization
    if (organizationId) {
        filters.organization_id = organizationId;
    }

    return filters;
};

const sort = { last_message_at: -1 };
const options = { limit: 20 };

export function UserChannelList({ organizationId }) {
    const { client } = useChatContext();

    if (!client?.userID) {
        return null;
    }

    const filters = buildFilters(client.userID, organizationId);

    return (
        <div className="h-full">
            <ChannelList
                filters={filters}
                sort={sort}
                options={options}
                Preview={UserChannelPreview}
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
    );
}
