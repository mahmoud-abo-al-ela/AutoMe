"use client";
import { logError } from "@/lib/utils/errors";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
    Channel,
    MessageInput,
    MessageList,
    Thread,
    Window,
    useChatContext,
} from "stream-chat-react";
import { MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { NoAttachmentSelector } from "./no-attachments";
import { ChatMessageStatus } from "./ChatMessageStatus";
import { ConversationHeader } from "./ConversationHeader";
export function ChatWindow() {
    const t = useTranslations("chat.window");
    const { channel } = useChatContext();

    // Mark channel as read when it becomes active
    useEffect(() => {
        if (channel) {
            // Mark the channel as read when user opens it
            channel.markRead().catch((error) => {
                logError("Error marking channel as read:", error);
            });
        }
    }, [channel]);

    if (!channel) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8 bg-background">
                <div className="max-w-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base md:text-lg mb-2">
                        {t("emptyTitle")}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {t("emptyBody")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Channel
            channel={channel}
            markReadOnMount={false}
            Message={ChatMessage}
            AttachmentSelector={NoAttachmentSelector}
            MessageStatus={ChatMessageStatus}
        >
            <Window>
                <ConversationHeader channel={channel} />
                <MessageList />
                <MessageInput />
            </Window>
            <Thread />
        </Channel>
    );
}
