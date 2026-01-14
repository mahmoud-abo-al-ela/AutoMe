"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { getAllConversations, getUnreadCount } from "@/actions/messages";

export function useAdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, isSignedIn } = useUser();
  const searchParams = useSearchParams();

  const conversationIdFromUrl = searchParams.get("conversation");

  // Fetch conversations
  const fetchConversations = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllConversations({ page, limit: 20 });

        if (response.success) {
          setConversations(response.data.conversations);
          setPagination(response.data.pagination);

          // Auto-select conversation only if specified in URL
          if (conversationIdFromUrl && response.data.conversations.length > 0) {
            const targetConversation = response.data.conversations.find(
              (c) => c.id === conversationIdFromUrl
            );
            if (targetConversation) {
              setSelectedConversation(targetConversation);
            }
          }
        } else {
          setError(response.error?.message || "Failed to load conversations");
        }
      } catch (err) {
        setError("Failed to load conversations");
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    },
    [conversationIdFromUrl]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isSignedIn) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [isSignedIn, fetchConversations, fetchUnreadCount]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    // Update URL without full navigation
    if (conversation) {
      const url = new URL(window.location.href);
      url.searchParams.set("conversation", conversation.id);
      window.history.pushState({}, "", url);
    }
  }, []);

  // Refresh conversations
  const refresh = useCallback(() => {
    return fetchConversations(pagination.page);
  }, [fetchConversations, pagination.page]);

  // Get user info for a conversation (the non-admin user)
  const getConversationUser = useCallback((conversation) => {
    // Find participant who is USER role (not ADMIN)
    const userParticipant = conversation?.participants?.find(
      (p) => p.role === "USER"
    );
    return userParticipant || conversation?.participants?.[0] || null;
  }, []);

  return {
    conversations,
    loading,
    error,
    selectedConversation,
    pagination,
    unreadCount,
    currentUserId: user?.id,
    currentUserName: user?.fullName || user?.firstName,
    isSignedIn,
    handleSelectConversation,
    refresh,
    refreshUnreadCount: fetchUnreadCount,
    getConversationUser,
  };
}
