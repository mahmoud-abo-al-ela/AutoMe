"use client";

import { MessagesPresenter } from "@/components/Messages";
import { getOrgConversations, getConversationDetails, sendMessageAction } from "@/actions/messages";

export function OrgMessagesPageClient({ initialConversations, currentUserId, orgMembers, slug }) {
    return (
        <MessagesPresenter
            initialConversations={initialConversations}
            currentUserId={currentUserId}
            onLoadConversation={getConversationDetails}
            onRefreshConversations={() => getOrgConversations(slug)}
            onSendMessage={sendMessageAction}
            isOrgView={true}
            orgMembers={orgMembers}
            title="Messages"
            subtitle="Manage customer conversations and inquiries"
            searchPlaceholder="Search conversations..."
            emptyStateTitle="No conversations yet"
            emptyStateDescription="Customer conversations will appear here"
        />
    );
}
