"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { getConversations } from "@/actions/messages";

export function useMessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

    const { user, isSignedIn, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();

    const conversationIdFromUrl = searchParams.get("conversation");

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in?redirect_url=/messages");
        }
    }, [isLoaded, isSignedIn, router]);

    // Fetch conversations
    const fetchConversations = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getConversations({ page, limit: 20 });

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
    }, [conversationIdFromUrl]);

    // Initial fetch
    useEffect(() => {
        if (isSignedIn) {
            fetchConversations();
        }
    }, [isSignedIn, fetchConversations]);

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

    return {
        conversations,
        loading,
        error,
        selectedConversation,
        pagination,
        currentUserId: user?.id,
        currentUserName: user?.fullName || user?.firstName,
        isSignedIn,
        isLoaded,
        handleSelectConversation,
        refresh,
    };
}
