import {
    getConversationsByUserId,
    getConversationsByOrganizationId,
    getConversationById,
    getMessagesByConversationId,
    getUnreadMessageCount,
    findOrCreateConversation,
    createMessage,
    markMessagesAsRead,
    deleteConversation,
} from "@/lib/repositories/message";
import { createAdminClient } from "@/lib/supabase";

export async function getUserConversations(userId) {
    return await getConversationsByUserId(userId);
}

export async function getOrganizationConversations(organizationId) {
    return await getConversationsByOrganizationId(organizationId);
}

export async function getConversation(conversationId, userId) {
    return await getConversationById(conversationId, userId);
}

export async function getConversationMessages(conversationId, userId) {
    return await getMessagesByConversationId(conversationId, userId);
}

export async function getUserUnreadCount(userId) {
    return await getUnreadMessageCount(userId);
}

export async function startConversation(userId, organizationId, carId = null) {
    return await findOrCreateConversation(userId, organizationId, carId);
}

export async function sendMessage(conversationId, senderId, content) {
    const message = await createMessage(conversationId, senderId, content);

    // Note: Real-time updates are handled by Supabase replication
    // Prisma writes to PostgreSQL, and Supabase replicates changes automatically
    // No need to manually insert - the trigger will handle it

    return message;
}

export async function markConversationAsRead(conversationId, userId) {
    return await markMessagesAsRead(conversationId, userId);
}

export async function removeConversation(conversationId, userId) {
    return await deleteConversation(conversationId, userId);
}
