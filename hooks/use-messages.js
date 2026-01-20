import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { getMyConversations, getConversationDetails } from "@/actions/messages";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

export function useMessages(currentUserId) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getMyConversations();

            if (result.success) {
                setConversations(result.data);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    return {
        conversations,
        loading,
        error,
        refresh: loadConversations,
    };
}

export function useConversation(conversationId, currentUserId) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadConversation = useCallback(async () => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const result = await getConversationDetails(conversationId);

            if (result.success) {
                setConversation(result.data.conversation);
                setMessages(result.data.messages);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        loadConversation();
    }, [loadConversation]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Message",
                    filter: `conversationId=eq.${conversationId}`,
                },
                async () => {
                    // Reload conversation to get new messages
                    await loadConversation();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, loadConversation]);

    const addMessage = useCallback((newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
    }, []);

    return {
        conversation,
        messages,
        loading,
        error,
        refresh: loadConversation,
        addMessage,
    };
}

export function useUnreadCount(currentUserId) {
    const [count, setCount] = useState(0);

    const updateCount = useCallback(async () => {
        try {
            const { getUnreadCount } = await import("@/actions/messages");
            const result = await getUnreadCount();

            if (result.success) {
                setCount(result.data);
            }
        } catch (err) {
            console.error("Failed to get unread count:", err);
        }
    }, []);

    useEffect(() => {
        updateCount();

        // Update every 30 seconds
        const interval = setInterval(updateCount, 30000);

        return () => clearInterval(interval);
    }, [updateCount]);

    return { count, refresh: updateCount };
}
