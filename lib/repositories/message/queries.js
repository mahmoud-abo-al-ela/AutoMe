import { db as prisma } from "@/lib/prisma";

export async function getConversationsByUserId(userId) {
    return await prisma.conversation.findMany({
        where: {
            participants: {
                some: { id: userId },
            },
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    slug: true,
                },
            },
            car: {
                select: {
                    id: true,
                    make: true,
                    model: true,
                    year: true,
                    images: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    senderId: true,
                    readAt: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getConversationsByOrganizationId(organizationId) {
    return await prisma.conversation.findMany({
        where: { organizationId },
        include: {
            car: {
                select: {
                    id: true,
                    make: true,
                    model: true,
                    year: true,
                    images: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    senderId: true,
                    readAt: true,
                },
            },
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function getConversationById(conversationId, userId) {
    return await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: { id: userId },
            },
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    slug: true,
                },
            },
            car: {
                select: {
                    id: true,
                    make: true,
                    model: true,
                    year: true,
                    images: true,
                    price: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
        },
    });
}

export async function getMessagesByConversationId(conversationId, userId) {
    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: { id: userId },
            },
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    return await prisma.message.findMany({
        where: { conversationId },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function getUnreadMessageCount(userId) {
    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: { id: userId },
            },
        },
        select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    return await prisma.message.count({
        where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            readAt: null,
        },
    });
}

export async function findOrCreateConversation(userId, organizationId, carId = null) {
    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
        where: {
            organizationId,
            carId,
            participants: {
                some: { id: userId },
            },
        },
        include: {
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
        },
    });

    if (existing) {
        return existing;
    }

    // Create new conversation
    return await prisma.conversation.create({
        data: {
            organizationId,
            carId,
            participants: {
                connect: [{ id: userId }],
            },
        },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    slug: true,
                },
            },
            car: {
                select: {
                    id: true,
                    make: true,
                    model: true,
                    year: true,
                    images: true,
                },
            },
            participants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                },
            },
        },
    });
}
