"use client";

import { useEffect, useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { MessageBubble, DateSeparator, TypingIndicator } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useChat, useTypingIndicator } from "@/hooks/use-chat";
import { isSameDay, parseISO } from "date-fns";

/**
 * Main chat window component
 */
export function ChatWindow({ conversationId, currentUserId, currentUserName, className }) {
    const { messages, loading, sending, error, hasMore, sendMessage, loadMore } = useChat(conversationId, currentUserId);
    const { typingUsers, sendTyping } = useTypingIndicator(conversationId, currentUserId);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousScrollHeightRef = useRef(0);

    // Group messages by date for separators
    const groupedMessages = useMemo(() => {
        if (!messages.length) return [];

        const result = [];
        let currentDate = null;

        messages.forEach((message, index) => {
            const messageDate = typeof message.createdAt === "string" ? parseISO(message.createdAt) : message.createdAt;

            // Add date separator if new day
            if (!currentDate || !isSameDay(currentDate, messageDate)) {
                result.push({ type: "date", date: messageDate, id: `date-${index}` });
                currentDate = messageDate;
            }

            // Check if we should show avatar (first message or different sender)
            const prevMessage = messages[index - 1];
            const showAvatar =
                !prevMessage ||
                prevMessage.senderId !== message.senderId ||
                (prevMessage.createdAt &&
                    message.createdAt &&
                    !isSameDay(
                        typeof prevMessage.createdAt === "string" ? parseISO(prevMessage.createdAt) : prevMessage.createdAt,
                        messageDate
                    ));

            result.push({ type: "message", message, showAvatar, id: message.id });
        });

        return result;
    }, [messages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current && messagesContainerRef.current && !loading) {
            // Scroll within container only, not the whole page
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages.length, loading]);

    // Handle scroll for loading more
    const handleScroll = (e) => {
        const { scrollTop } = e.target;

        // Load more when scrolled near top
        if (scrollTop < 100 && hasMore && !loading) {
            previousScrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;
            loadMore().then(() => {
                // Maintain scroll position after loading
                if (messagesContainerRef.current) {
                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeightRef.current;
                }
            });
        }
    };

    const handleSend = async (content) => {
        await sendMessage(content);
    };

    const handleTyping = () => {
        sendTyping(currentUserName || "User");
    };

    if (error) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <p className="text-destructive mb-2">Error loading messages</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className || ""}`}>
            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 overscroll-contain"
            >
                {/* Loading indicator at top */}
                {loading && (
                    <div className="flex justify-center py-3 sm:py-4">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                            <span className="text-2xl sm:text-3xl text-white">💬</span>
                        </div>
                        <p className="text-lg sm:text-xl font-semibold mb-1">Start the conversation</p>
                        <p className="text-sm text-muted-foreground max-w-[250px]">
                            Ask about this car, schedule a viewing, or get more details
                        </p>
                    </div>
                )}

                {/* Messages */}
                <div className="space-y-1.5 sm:space-y-2">
                    {groupedMessages.map((item) => {
                        if (item.type === "date") {
                            return <DateSeparator key={item.id} date={item.date} />;
                        }

                        return (
                            <MessageBubble
                                key={item.id}
                                message={item.message}
                                isOwn={item.message.sender?.clerkId === currentUserId}
                                showAvatar={item.showAvatar}
                            />
                        );
                    })}
                </div>

                {/* Typing indicator */}
                <TypingIndicator users={typingUsers} />

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <MessageInput onSend={handleSend} disabled={sending} onTyping={handleTyping} />
        </div>
    );
}
