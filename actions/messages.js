"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as messageService from "@/lib/services/message";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { checkUser } from "@/lib/checkUser";

/**
 * Start or get existing conversation (optionally about a specific car)
 */
export async function startConversation(carId = null) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const conversation = await messageService.startConversation(userId, carId);

    revalidatePath("/messages");

    return createSuccessResponse(conversation, "Conversation started");
  } catch (error) {
    console.error("Error starting conversation:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get user's conversations
 */
export async function getConversations({ page = 1, limit = 20 } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await messageService.getUserConversations(userId, {
      page,
      limit,
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error getting conversations:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get all conversations (admin)
 */
export async function getAllConversations({ page = 1, limit = 20 } = {}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await checkUser();
    const organization = await getCurrentOrganization();
    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const result = await messageService.getAllConversations(userId, organization.id, {
      page,
      limit,
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error getting all conversations:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get a specific conversation
 */
export async function getConversation(conversationId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const conversation = await messageService.getConversation(
      conversationId,
      userId
    );

    return createSuccessResponse(conversation);
  } catch (error) {
    console.error("Error getting conversation:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId,
  { page = 1, limit = 50 } = {}
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const result = await messageService.getConversationMessages(
      conversationId,
      userId,
      { page, limit }
    );

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error getting messages:", error);
    return createErrorResponse(error);
  }
}

/**
 * Send a message
 */
export async function sendMessage(conversationId, content) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const message = await messageService.sendMessage(
      conversationId,
      content,
      userId
    );

    revalidatePath("/messages");
    revalidatePath("/admin/messages");

    return createSuccessResponse(message, "Message sent");
  } catch (error) {
    console.error("Error sending message:", error);
    return createErrorResponse(error);
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    await messageService.markAsRead(conversationId, userId);

    revalidatePath("/messages");
    revalidatePath("/admin/messages");

    return createSuccessResponse(null, "Messages marked as read");
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return createErrorResponse(error);
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const count = await messageService.getUnreadCount(userId);

    return createSuccessResponse({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return createErrorResponse(error);
  }
}
