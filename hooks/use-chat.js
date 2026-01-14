"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { getMessages, sendMessage as sendMessageAction, markMessagesAsRead, getUnreadCount } from "@/actions/messages";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * Hook for managing chat functionality with real-time updates
 */
export function useChat(conversationId, currentUserId) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);

    const supabaseRef = useRef(null);
    const channelRef = useRef(null);

    // Initialize Supabase client
    useEffect(() => {
        if (!supabaseUrl || !supabaseKey) {
            console.warn("Supabase credentials not configured - real-time disabled");
            return;
        }

        supabaseRef.current = createClient(supabaseUrl, supabaseKey);

        return () => {
            if (channelRef.current) {
                supabaseRef.current?.removeChannel(channelRef.current);
            }
        };
    }, []);

    // Fetch initial messages
    const fetchMessages = useCallback(
        async (pageNum = 1, append = false) => {
            if (!conversationId) return;

            try {
                setLoading(true);
                setError(null);

                const response = await getMessages(conversationId, { page: pageNum, limit: 50 });

                if (response.success) {
                    const { messages: newMessages, pagination } = response.data;

                    if (append) {
                        setMessages((prev) => [...newMessages, ...prev]);
                    } else {
                        setMessages(newMessages);
                    }

                    setHasMore(pageNum < pagination.totalPages);
                    setPage(pageNum);
                } else {
                    setError(response.error?.message || "Failed to load messages");
                }
            } catch (err) {
                setError("Failed to load messages");
                console.error("Error fetching messages:", err);
            } finally {
                setLoading(false);
            }
        },
        [conversationId]
    );

    // Load more messages (older)
    const loadMore = useCallback(async () => {
        if (hasMore && !loading) {
            await fetchMessages(page + 1, true);
        }
    }, [fetchMessages, hasMore, loading, page]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!conversationId || !supabaseRef.current) return;

        // Clean up previous subscription
        if (channelRef.current) {
            supabaseRef.current.removeChannel(channelRef.current);
        }

        // Subscribe to new messages in this conversation
        channelRef.current = supabaseRef.current
            .channel(`conversation:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Message",
                    filter: `conversationId=eq.${conversationId}`,
                },
                (payload) => {
                    // Add new message to the list if not from current user
                    // (our own messages are added optimistically)
                    const newMessage = payload.new;

                    setMessages((prev) => {
                        // Check if message already exists (optimistic update)
                        if (prev.some((m) => m.id === newMessage.id)) {
                            return prev;
                        }

                        // Format the message to match our serialized format
                        const formattedMessage = {
                            ...newMessage,
                            createdAt: newMessage.createdAt,
                            readAt: newMessage.readAt,
                            sender: null, // Will be filled by refetch if needed
                        };

                        return [...prev, formattedMessage];
                    });

                    // Mark as read if from someone else
                    if (newMessage.senderId !== currentUserId) {
                        markMessagesAsRead(conversationId).then(() => {
                            // Trigger refresh of unread badge
                            window.dispatchEvent(new CustomEvent("refresh-unread-count"));
                        }).catch(console.error);
                    }
                }
            )
            .subscribe();

        // Initial fetch and mark as read
        fetchMessages(1);
        
        // Mark existing messages as read when conversation is opened
        markMessagesAsRead(conversationId).then(() => {
            window.dispatchEvent(new CustomEvent("refresh-unread-count"));
        }).catch(console.error);

        return () => {
            if (channelRef.current) {
                supabaseRef.current?.removeChannel(channelRef.current);
            }
        };
    }, [conversationId, currentUserId, fetchMessages]);

    // Send message
    const sendMessage = useCallback(
        async (content) => {
            if (!conversationId || !content.trim() || sending) return null;

            try {
                setSending(true);
                setError(null);

                // Optimistic update
                const tempId = `temp-${Date.now()}`;
                const optimisticMessage = {
                    id: tempId,
                    content: content.trim(),
                    senderId: currentUserId,
                    conversationId,
                    createdAt: new Date().toISOString(),
                    readAt: null,
                    sender: { id: currentUserId },
                    _pending: true,
                };

                setMessages((prev) => [...prev, optimisticMessage]);

                const response = await sendMessageAction(conversationId, content.trim());

                if (response.success) {
                    // Replace optimistic message with real one
                    setMessages((prev) =>
                        prev.map((m) => (m.id === tempId ? { ...response.data, _pending: false } : m))
                    );
                    return response.data;
                } else {
                    // Remove optimistic message on error
                    setMessages((prev) => prev.filter((m) => m.id !== tempId));
                    setError(response.error?.message || "Failed to send message");
                    return null;
                }
            } catch (err) {
                setError("Failed to send message");
                console.error("Error sending message:", err);
                return null;
            } finally {
                setSending(false);
            }
        },
        [conversationId, currentUserId, sending]
    );

    // Refresh messages
    const refresh = useCallback(() => {
        return fetchMessages(1);
    }, [fetchMessages]);

    return {
        messages,
        loading,
        sending,
        error,
        hasMore,
        sendMessage,
        loadMore,
        refresh,
    };
}

/**
 * Hook for managing unread message count
 */
export function useUnreadCount() {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCount = useCallback(async () => {
        try {
            const response = await getUnreadCount();
            if (response.success) {
                setCount(response.data.count);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCount();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchCount, 30000);

        return () => clearInterval(interval);
    }, [fetchCount]);

    return { count, loading, refresh: fetchCount };
}

/**
 * Hook for typing indicator (broadcast channel)
 */
export function useTypingIndicator(conversationId, currentUserId) {
    const [typingUsers, setTypingUsers] = useState([]);
    const supabaseRef = useRef(null);
    const channelRef = useRef(null);
    const timeoutRef = useRef({});

    useEffect(() => {
        if (!supabaseUrl || !supabaseKey || !conversationId) return;

        supabaseRef.current = createClient(supabaseUrl, supabaseKey);

        channelRef.current = supabaseRef.current.channel(`typing:${conversationId}`, {
            config: {
                broadcast: { self: false },
            },
        });

        channelRef.current
            .on("broadcast", { event: "typing" }, ({ payload }) => {
                const { userId, userName } = payload;

                if (userId === currentUserId) return;

                setTypingUsers((prev) => {
                    if (!prev.some((u) => u.id === userId)) {
                        return [...prev, { id: userId, name: userName }];
                    }
                    return prev;
                });

                // Clear existing timeout
                if (timeoutRef.current[userId]) {
                    clearTimeout(timeoutRef.current[userId]);
                }

                // Remove user after 3 seconds of no typing
                timeoutRef.current[userId] = setTimeout(() => {
                    setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
                }, 3000);
            })
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabaseRef.current?.removeChannel(channelRef.current);
            }
            Object.values(timeoutRef.current).forEach(clearTimeout);
        };
    }, [conversationId, currentUserId]);

    const sendTyping = useCallback(
        (userName) => {
            if (channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "typing",
                    payload: { userId: currentUserId, userName },
                });
            }
        },
        [currentUserId]
    );

    return { typingUsers, sendTyping };
}
