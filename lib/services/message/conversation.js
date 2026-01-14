// Conversation service functions
import * as messageRepository from "@/lib/repositories/message";
import * as userRepository from "@/lib/repositories/user";
import * as carRepository from "@/lib/repositories/car";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/utils/errors";

/**
 * Start or get existing conversation
 */
export async function startConversation(userId, carId = null) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const admins = await messageRepository.findAdminUsers();
  if (admins.length === 0) {
    throw new ValidationError("No admin users available to chat with");
  }

  if (carId) {
    const car = await carRepository.findCarById(carId);
    if (!car) {
      throw new NotFoundError("Car");
    }
  }

  const participantIds = [user.id, ...admins.map((a) => a.id)];

  const existingConversation = await messageRepository.findExistingConversation(
    participantIds,
    carId
  );
  if (existingConversation) {
    return existingConversation;
  }

  return await messageRepository.createConversation({
    participantIds,
    carId,
  });
}

/**
 * Get user's conversations
 */
export async function getUserConversations(userId, pagination = {}) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const result = await messageRepository.findUserConversations(
    user.id,
    pagination
  );
  const unreadCounts = await messageRepository.getUnreadCountPerConversation(
    user.id
  );

  result.conversations = result.conversations.map((conv) => ({
    ...conv,
    unreadCount: unreadCounts[conv.id] || 0,
  }));

  return result;
}

/**
 * Get all conversations (admin only)
 */
export async function getAllConversations(userId, pagination = {}) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Only admins can view all conversations");
  }

  const result = await messageRepository.findAllConversations(pagination);
  const unreadCounts = await messageRepository.getUnreadCountPerConversation(
    user.id
  );

  result.conversations = result.conversations.map((conv) => ({
    ...conv,
    unreadCount: unreadCounts[conv.id] || 0,
  }));

  return result;
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId, userId) {
  const user = await userRepository.findUserByClerkId(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const conversation = await messageRepository.findConversationById(
    conversationId
  );
  if (!conversation) {
    throw new NotFoundError("Conversation");
  }

  const isParticipant = conversation.participants.some((p) => p.id === user.id);
  if (!isParticipant && user.role !== "ADMIN") {
    throw new AuthorizationError(
      "You are not a participant in this conversation"
    );
  }

  return conversation;
}
