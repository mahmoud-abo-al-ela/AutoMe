"use client";

import { MessagesPresenter } from "@/components/Messages";
import { getMyConversations, getConversationDetails, sendMessageAction } from "@/actions/messages";

export function MessagesPageClient({ initialConversations, currentUserId }) {
    return (
        <MessagesPresenter
            initialConversations={initialConversations}
            currentUserId={currentUserId}
            onLoadConversation={getConversationDetails}
            onRefreshConversations={getMyConversations}
            onSendMessage={sendMessageAction}
            isOrgView={false}
            title="Messages"
            subtitle="Chat with dealerships about cars you're interested in"
            emptyStateTitle="No conversations yet"
            emptyStateDescription="Start a conversation with a dealership about a car you're interested in"
        />
    );
}
