import { db as prisma } from "@/lib/prisma";

export async function createMessage(conversationId, senderId, content) {
    // Verify sender has access to conversation
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: { id: senderId },
            },
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    // Create message and update conversation timestamp
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId,
            content,
        },
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
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    return message;
}

export async function markMessagesAsRead(conversationId, userId) {
    return await prisma.message.updateMany({
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

export async function deleteConversation(conversationId, userId) {
    // Verify user has access
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

    // Delete all messages first
    await prisma.message.deleteMany({
        where: { conversationId },
    });

    // Delete conversation
    return await prisma.conversation.delete({
        where: { id: conversationId },
    });
}
