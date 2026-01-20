"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

export function MessagesPresenter({
    initialConversations,
    currentUserId,
    onLoadConversation,
    onRefreshConversations,
    onSendMessage,
    isOrgView = false,
    orgMembers = [],
    title = "Messages",
    subtitle = "Chat with dealerships about cars you're interested in",
    searchPlaceholder = "Search conversations...",
    emptyStateTitle = "No conversations yet",
    emptyStateDescription = "Start a conversation with a dealership about a car you're interested in",
}) {
    const [conversations, setConversations] = useState(initialConversations);
    const [filteredConversations, setFilteredConversations] = useState(initialConversations);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Update conversations when prop changes
    useEffect(() => {
        setConversations(initialConversations);
    }, [initialConversations]);

    // Filter conversations based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredConversations(conversations);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = conversations.filter((conv) => {
            if (isOrgView) {
                const customer = conv.participants?.find(p => !orgMembers.includes(p.id));
                const customerName = customer?.name?.toLowerCase() || "";
                const customerEmail = customer?.email?.toLowerCase() || "";
                const carInfo = conv.car
                    ? `${conv.car.year} ${conv.car.make} ${conv.car.model}`.toLowerCase()
                    : "";
                const lastMessage = conv.messages?.[0]?.content?.toLowerCase() || "";

                return (
                    customerName.includes(query) ||
                    customerEmail.includes(query) ||
                    carInfo.includes(query) ||
                    lastMessage.includes(query)
                );
            } else {
                const orgName = conv.organization?.name?.toLowerCase() || "";
                const carInfo = conv.car
                    ? `${conv.car.year} ${conv.car.make} ${conv.car.model}`.toLowerCase()
                    : "";
                const lastMessage = conv.messages?.[0]?.content?.toLowerCase() || "";

                return (
                    orgName.includes(query) ||
                    carInfo.includes(query) ||
                    lastMessage.includes(query)
                );
            }
        });

        setFilteredConversations(filtered);
    }, [searchQuery, conversations, isOrgView, orgMembers]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!selectedConversationId) return;

        const channel = supabase
            .channel(`conversation:${selectedConversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Message",
                    filter: `conversationId=eq.${selectedConversationId}`,
                },
                async () => {
                    const result = await onLoadConversation(selectedConversationId);
                    if (result.success) {
                        setMessages(result.data.messages);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversationId, onLoadConversation]);

    // Refresh conversations periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            const result = await onRefreshConversations();
            if (result.success) {
                setConversations(result.data);
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [onRefreshConversations]);

    const loadConversation = useCallback(async (conversationId) => {
        setLoading(true);
        setSelectedConversationId(conversationId);
        setShowMobileThread(true);

        const result = await onLoadConversation(conversationId);

        if (result.success) {
            setSelectedConversation(result.data.conversation);
            setMessages(result.data.messages);
        } else {
            toast.error(result.error || "Failed to load conversation");
        }

        setLoading(false);
    }, [onLoadConversation]);

    const handleBackToList = () => {
        setShowMobileThread(false);
        setSelectedConversationId(null);
        setSelectedConversation(null);
    };

    const handleMessageSent = async (content) => {
        const result = await onSendMessage(selectedConversationId, content);

        if (result.success) {
            setMessages((prev) => [...prev, result.data]);

            // Update conversation list
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === selectedConversationId
                        ? {
                            ...conv,
                            messages: [
                                {
                                    id: result.data.id,
                                    content: result.data.content,
                                    createdAt: result.data.createdAt,
                                    senderId: result.data.senderId,
                                    readAt: result.data.readAt,
                                },
                            ],
                            updatedAt: new Date(),
                        }
                        : conv
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );
        }

        return result;
    };

    return (
        <div className={`container mx-auto px-4 pb-6 ${isOrgView ? "pt-6" : "pt-20"} max-w-[1600px]`}>
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-0 h-[calc(100vh-220px)] md:h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card shadow-sm">
                {/* Conversations List */}
                <div className={`
                    border-r flex flex-col overflow-hidden bg-background
                    ${showMobileThread ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-4 border-b bg-muted/30 flex-shrink-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-base md:text-lg">Conversations</h2>
                            {conversations.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {conversations.length}
                                </span>
                            )}
                        </div>
                        {isOrgView && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ConversationList
                            conversations={filteredConversations}
                            selectedId={selectedConversationId}
                            onSelect={loadConversation}
                            currentUserId={currentUserId}
                            isOrgView={isOrgView}
                            orgMembers={orgMembers}
                            emptyStateTitle={emptyStateTitle}
                            emptyStateDescription={emptyStateDescription}
                        />
                    </div>
                </div>

                {/* Message Thread */}
                <div className={`
                    flex flex-col overflow-hidden bg-background
                    ${showMobileThread ? 'flex' : 'hidden md:flex'}
                `}>
                    {loading ? (
                        <div className="flex-1 p-4 space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-16 w-3/4" />
                            <Skeleton className="h-16 w-2/3 ml-auto" />
                        </div>
                    ) : selectedConversation ? (
                        <>
                            {/* Mobile back button */}
                            <div className="md:hidden border-b p-3 bg-background flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBackToList}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to conversations
                                </Button>
                            </div>
                            <MessageThread
                                conversation={selectedConversation}
                                messages={messages}
                                currentUserId={currentUserId}
                                isOrgView={isOrgView}
                                orgMembers={orgMembers}
                                onMessageSent={handleMessageSent}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div className="max-w-sm">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-base md:text-lg mb-2">Select a conversation</h3>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                    Choose a conversation from the list to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
