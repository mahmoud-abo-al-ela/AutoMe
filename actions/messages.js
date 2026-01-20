"use server";

import { auth } from "@clerk/nextjs/server";
import {
    getUserConversations,
    getOrganizationConversations,
    getConversation,
    getConversationMessages,
    getUserUnreadCount,
    startConversation,
    sendMessage,
    markConversationAsRead,
    removeConversation,
} from "@/lib/services/message";
import { getOrganization } from "@/lib/getOrganization";
import { db as prisma } from "@/lib/prisma";

export async function getMyConversations() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const conversations = await getUserConversations(user.id);
        return { success: true, data: conversations };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: error.message };
    }
}

export async function getOrgConversations(slug) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const { organization, membership } = await getOrganization(slug);
        if (!organization || !membership) {
            return { success: false, error: "Organization not found or access denied" };
        }

        const conversations = await getOrganizationConversations(organization.id);
        return { success: true, data: conversations };
    } catch (error) {
        console.error("Error fetching org conversations:", error);
        return { success: false, error: error.message };
    }
}

export async function getConversationDetails(conversationId) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const conversation = await getConversation(conversationId, user.id);
        if (!conversation) {
            return { success: false, error: "Conversation not found" };
        }

        const messages = await getConversationMessages(conversationId, user.id);

        // Mark messages as read
        await markConversationAsRead(conversationId, user.id);

        return { success: true, data: { conversation, messages } };
    } catch (error) {
        console.error("Error fetching conversation details:", error);
        return { success: false, error: error.message };
    }
}

export async function createConversation(organizationId, carId = null) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const conversation = await startConversation(user.id, organizationId, carId);
        return { success: true, data: conversation };
    } catch (error) {
        console.error("Error creating conversation:", error);
        return { success: false, error: error.message };
    }
}

export async function sendMessageAction(conversationId, content) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (!content || content.trim().length === 0) {
            return { success: false, error: "Message content is required" };
        }

        const message = await sendMessage(conversationId, user.id, content.trim());
        return { success: true, data: message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: error.message };
    }
}

export async function markAsRead(conversationId) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        await markConversationAsRead(conversationId, user.id);
        return { success: true };
    } catch (error) {
        console.error("Error marking as read:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteConversationAction(conversationId) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        await removeConversation(conversationId, user.id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return { success: false, error: error.message };
    }
}

export async function getUnreadCount() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const count = await getUserUnreadCount(user.id);
        return { success: true, data: count };
    } catch (error) {
        console.error("Error getting unread count:", error);
        return { success: false, error: error.message };
    }
}
