// Message service functions
import * as messageRepository from "@/lib/repositories/message";
import * as userRepository from "@/lib/repositories/user";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/utils/errors";
import { sendEmailNotifications } from "./notifications";

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId,
  userId,
  pagination = {}
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const conversation = await messageRepository.findConversationById(
    conversationId
  );
  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  // Check if user is an ADMIN or has OWNER role in any organization
  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = user.memberships?.some(m => m.role === "OWNER");

  const isParticipant = conversation.participants.some((p) => p.id === user.id);
  if (!isParticipant && !isAdmin && !hasOrgAccess) {
    throw new AuthorizationError(
      "You are not a participant in this conversation"
    );
  }

  await messageRepository.markMessagesAsRead(conversationId, user.id);

  return await messageRepository.findConversationMessages(
    conversationId,
    pagination
  );
}

/**
 * Send a message
 */
export async function sendMessage(conversationId, content, userId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  if (!content || content.trim().length === 0) {
    throw new ValidationError("Message content cannot be empty", "content");
  }

  if (content.length > 5000) {
    throw new ValidationError(
      "Message content is too long (max 5000 characters)",
      "content"
    );
  }

  const conversation = await messageRepository.findConversationById(
    conversationId
  );
  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  // Check if user is an ADMIN or has OWNER role in any organization
  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = user.memberships?.some(m => m.role === "OWNER");

  const isParticipant = conversation.participants.some((p) => p.id === user.id);
  if (!isParticipant && !isAdmin && !hasOrgAccess) {
    throw new AuthorizationError(
      "You are not a participant in this conversation"
    );
  }

  const message = await messageRepository.createMessage({
    content: content.trim(),
    senderId: user.id,
    conversationId,
  });

  // Send email notifications (async, don't wait)
  sendEmailNotifications(conversationId, user, content, conversation.car).catch(
    console.error
  );

  return message;
}

/**
 * Mark messages as read
 */
export async function markAsRead(conversationId, userId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const conversation = await messageRepository.findConversationById(
    conversationId
  );
  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  // Check if user is an ADMIN or has OWNER role in any organization
  const isAdmin = user.role === "ADMIN";
  const hasOrgAccess = user.memberships?.some(m => m.role === "OWNER");

  const isParticipant = conversation.participants.some((p) => p.id === user.id);
  if (!isParticipant && !isAdmin && !hasOrgAccess) {
    throw new AuthorizationError(
      "You are not a participant in this conversation"
    );
  }

  await messageRepository.markMessagesAsRead(conversationId, user.id);

  return { success: true };
}

/**
 * Get total unread count for a user
 */
export async function getUnreadCount(userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return await messageRepository.getUnreadMessageCount(user.id);
}
