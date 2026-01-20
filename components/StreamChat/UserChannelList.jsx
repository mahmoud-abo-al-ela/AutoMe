"use client";

import { ChannelList } from "stream-chat-react";
import { useChatContext } from "stream-chat-react";
import { UserChannelPreview } from "./UserChannelPreview";

const filters = (userId) => ({
    type: "messaging",
    members: { $in: [userId] },
});

const sort = { last_message_at: -1 };
const options = { limit: 20 };

export function UserChannelList() {
    const { client } = useChatContext();

    if (!client?.userID) {
        return null;
    }

    return (
        <div className="h-full">
            <ChannelList
                filters={filters(client.userID)}
                sort={sort}
                options={options}
                Preview={UserChannelPreview}
                setActiveChannelOnMount={false}
                showChannelSearch
                additionalChannelSearchProps={{
                    searchForChannels: true,
                    searchQueryParams: {
                        channelFilters: {
                            filters: filters(client.userID),
                        },
                    },
                }}
            />
        </div>
    );
}
