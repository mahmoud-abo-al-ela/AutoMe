// Message repository functions
import { db } from "@/lib/prisma";
import { serializeMessage } from "@/lib/utils/serializers";

/**
 * Create a new message
 */
export async function createMessage({ content, senderId, conversationId }) {
    const message = await db.message.create({
        data: {
            content,
            senderId,
            conversationId,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                    role: true,
                    clerkId: true,
                },
            },
        },
    });

    // Update conversation's updatedAt
    await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    return serializeMessage(message);
}

/**
 * Get messages for a conversation with pagination
 */
export async function findConversationMessages(conversationId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        db.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imageUrl: true,
                        role: true,
                        clerkId: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
            skip,
            take: limit,
        }),
        db.message.count({ where: { conversationId } }),
    ]);

    return {
        messages: messages.map(serializeMessage),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId, userId) {
    await db.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId) {
    const count = await db.message.count({
        where: {
            conversation: {
                participants: {
                    some: { id: userId },
                },
            },
            senderId: { not: userId },
            readAt: null,
        },
    });

    return count;
}

/**
 * Get unread count per conversation for a user
 */
export async function getUnreadCountPerConversation(userId) {
    const conversations = await db.conversation.findMany({
        where: {
            participants: {
                some: { id: userId },
            },
        },
        select: {
            id: true,
            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: { not: userId },
                            readAt: null,
                        },
                    },
                },
            },
        },
    });

    return conversations.reduce((acc, conv) => {
        acc[conv.id] = conv._count.messages;
        return acc;
    }, {});
}
