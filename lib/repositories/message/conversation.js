// Conversation repository functions
import { db } from "@/lib/prisma";
import { serializeConversation } from "@/lib/utils/serializers";

const CONVERSATION_INCLUDE = {
    participants: {
        select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            role: true,
        },
    },
    car: {
        select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            images: true,
        },
    },
    messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
    },
};

/**
 * Create a new conversation
 */
export async function createConversation({ participantIds, carId = null }) {
    const conversation = await db.conversation.create({
        data: {
            carId,
            participants: {
                connect: participantIds.map((id) => ({ id })),
            },
        },
        include: CONVERSATION_INCLUDE,
    });

    return serializeConversation(conversation);
}

/**
 * Find existing conversation between participants
 */
export async function findExistingConversation(participantIds, carId = null) {
    const conversation = await db.conversation.findFirst({
        where: {
            carId,
            AND: participantIds.map((id) => ({
                participants: {
                    some: { id },
                },
            })),
        },
        include: CONVERSATION_INCLUDE,
    });

    return conversation ? serializeConversation(conversation) : null;
}

/**
 * Find conversation by ID
 */
export async function findConversationById(id) {
    const conversation = await db.conversation.findUnique({
        where: { id },
        include: {
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                    role: true,
                },
            },
            car: {
                select: {
                    id: true,
                    title: true,
                    make: true,
                    model: true,
                    year: true,
                    images: true,
                },
            },
        },
    });

    return conversation ? serializeConversation(conversation) : null;
}

/**
 * Get conversations for a user with pagination
 */
export async function findUserConversations(userId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
        db.conversation.findMany({
            where: {
                participants: {
                    some: { id: userId },
                },
            },
            include: CONVERSATION_INCLUDE,
            orderBy: { updatedAt: "desc" },
            skip,
            take: limit,
        }),
        db.conversation.count({
            where: {
                participants: {
                    some: { id: userId },
                },
            },
        }),
    ]);

    return {
        conversations: conversations.map(serializeConversation),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get all conversations (for admin)
 */
export async function findAllConversations(pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
        db.conversation.findMany({
            include: CONVERSATION_INCLUDE,
            orderBy: { updatedAt: "desc" },
            skip,
            take: limit,
        }),
        db.conversation.count(),
    ]);

    return {
        conversations: conversations.map(serializeConversation),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get conversation participants' emails (for notifications)
 */
export async function getConversationParticipants(conversationId, excludeUserId = null) {
    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
                where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
            },
        },
    });

    return conversation?.participants || [];
}

/**
 * Find admin users
 */
export async function findAdminUsers() {
    return await db.user.findMany({
        where: { role: "ADMIN" },
        select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            role: true,
        },
    });
}
