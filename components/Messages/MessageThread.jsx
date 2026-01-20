"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Car, Loader2, Image as ImageIcon, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function MessageThread({
    conversation,
    messages,
    currentUserId,
    isOrgView = false,
    orgMembers = [],
    onMessageSent,
}) {
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const content = newMessage;
        setNewMessage("");

        const result = await onMessageSent(content);

        if (!result.success) {
            toast.error(result.error || "Failed to send message");
            setNewMessage(content);
        } else {
            toast.success("Message sent");
        }

        setSending(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) {
            return format(messageDate, "h:mm a");
        } else if (isYesterday(messageDate)) {
            return `Yesterday ${format(messageDate, "h:mm a")}`;
        } else {
            return format(messageDate, "MMM d, h:mm a");
        }
    };

    // Determine display info based on view type
    let headerInfo;
    if (isOrgView) {
        const customer = conversation.participants?.find(p => !orgMembers.includes(p.id));
        headerInfo = {
            avatar: customer?.imageUrl,
            name: customer?.name || "Unknown User",
            email: customer?.email,
            phone: customer?.phone,
            fallback: customer?.name?.substring(0, 2).toUpperCase() || "U",
        };
    } else {
        headerInfo = {
            avatar: conversation.organization?.logo,
            name: conversation.organization?.name || "Unknown Dealership",
            fallback: conversation.organization?.name?.substring(0, 2).toUpperCase() || "DL",
        };
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b p-3 md:p-4 bg-background flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={headerInfo.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {headerInfo.fallback}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-sm md:text-base truncate">
                            {headerInfo.name}
                        </h2>
                        {isOrgView ? (
                            <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground flex-wrap">
                                {headerInfo.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{headerInfo.email}</span>
                                    </div>
                                )}
                                {headerInfo.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                        <span>{headerInfo.phone}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            conversation.car && (
                                <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                                    <Car className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                        {conversation.car.year} {conversation.car.make} {conversation.car.model}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Car Info Card */}
            {conversation.car && (
                <div className="p-3 md:p-4 border-b bg-muted/30 flex-shrink-0">
                    <Link href={`/cars/${conversation.car.id}`} target={isOrgView ? "_blank" : "_self"}>
                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex gap-3">
                                {conversation.car.images?.[0] ? (
                                    <img
                                        src={conversation.car.images[0]}
                                        alt={`${conversation.car.make} ${conversation.car.model}`}
                                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm mb-1 truncate">
                                        {conversation.car.year} {conversation.car.make} {conversation.car.model}
                                    </h3>
                                    {conversation.car.price && (
                                        <p className="text-base md:text-lg font-bold text-primary">
                                            ${Number(conversation.car.price).toLocaleString()}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isOrgView ? "Click to view details" : "Click to view car"}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            )}

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div className="max-w-sm">
                            <p className="text-sm md:text-base text-muted-foreground">No messages yet</p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                {isOrgView
                                    ? "Start the conversation with your customer"
                                    : "Start the conversation by sending a message"
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = isOrgView
                            ? orgMembers.includes(message.senderId)
                            : message.senderId === currentUserId;
                        const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);

                        return (
                            <div
                                key={message.id}
                                className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}
                            >
                                {!isOwn && (
                                    <Avatar className={cn(
                                        "h-7 w-7 md:h-8 md:w-8 flex-shrink-0",
                                        !showAvatar && "invisible"
                                    )}>
                                        <AvatarImage src={message.sender?.imageUrl} />
                                        <AvatarFallback className="text-xs">
                                            {message.sender?.name?.substring(0, 2).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "flex flex-col max-w-[85%] md:max-w-[70%]",
                                    isOwn ? "items-end" : "items-start"
                                )}>
                                    {!isOwn && showAvatar && message.sender?.name && (
                                        <span className="text-xs text-muted-foreground mb-1 px-1">
                                            {message.sender.name}
                                        </span>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 md:px-4 md:py-2 break-words",
                                            isOwn
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1 px-1">
                                        {formatMessageDate(message.createdAt)}
                                        {isOwn && message.readAt && (
                                            <span className="ml-1">· Read</span>
                                        )}
                                    </span>
                                </div>
                                {isOwn && (
                                    <Avatar className={cn(
                                        "h-7 w-7 md:h-8 md:w-8 flex-shrink-0",
                                        !showAvatar && "invisible"
                                    )}>
                                        <AvatarImage src={message.sender?.imageUrl} />
                                        <AvatarFallback className="text-xs">
                                            {message.sender?.name?.substring(0, 2).toUpperCase() || "Y"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 md:p-4 bg-background flex-shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="min-h-[50px] md:min-h-[60px] max-h-[120px] resize-none text-sm md:text-base"
                        disabled={sending}
                        rows={1}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || sending}
                        className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] flex-shrink-0"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
