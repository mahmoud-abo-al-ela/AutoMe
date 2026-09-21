"use client";

import { useEffect, useMemo, useState } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "next-intl";
import { getStreamToken } from "@/actions/stream-chat";
import { createStreamI18n } from "@/i18n/stream-chat-i18n";
import type { Locale } from "@/i18n/routing";
import { logError } from "@/lib/utils/errors";

import "stream-chat-react/dist/css/v2/index.css";

let chatClient: StreamChat | null = null;

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
    const { user: clerkUser, isLoaded } = useUser();
    const locale = useLocale() as Locale;
    const [client, setClient] = useState<StreamChat | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);

    // Rebuilt on a language switch rather than mutated through setLanguage:
    // the instance also carries the dayjs locale used for every timestamp, and
    // a switch remounts the tree anyway.
    const i18nInstance = useMemo(() => createStreamI18n(locale), [locale]);

    useEffect(() => {
        if (!isLoaded || !clerkUser) {
            setIsConnecting(false);
            return;
        }

        const initChat = async () => {
            try {
                setIsConnecting(true);

                // Get Stream token from server
                const result = await getStreamToken();

                if (!result.success) {
                    logError("Failed to get Stream token:", result.error);
                    setIsConnecting(false);
                    return;
                }

                const { token, userId, apiKey } = result.data;

                // apiKey is process.env.NEXT_PUBLIC_STREAM_API_KEY passed
                // straight through, so it is undefined when unset — which
                // getInstance would have thrown on further down.
                if (!apiKey) {
                    logError("Stream API key is not configured");
                    setIsConnecting(false);
                    return;
                }

                // Create or reuse client
                if (!chatClient) {
                    chatClient = StreamChat.getInstance(apiKey);
                }

                // Connect user
                if (!chatClient.userID) {
                    await chatClient.connectUser(
                        {
                            id: userId,
                            name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress,
                            image: clerkUser.imageUrl,
                        },
                        token
                    );
                }

                setClient(chatClient);
            } catch (error) {
                logError(error);
            } finally {
                setIsConnecting(false);
            }
        };

        initChat();

        // Cleanup on unmount
        return () => {
            if (chatClient && chatClient.userID) {
                chatClient.disconnectUser().catch((err) => {
                    // Non-blocking disconnect on unmount
                    logError(err);
                });
                chatClient = null;
            }
        };
    }, [clerkUser, isLoaded]);

    if (isConnecting) {
        return <div>{children}</div>;
    }

    if (!client) {
        return <div>{children}</div>;
    }

    return (
        <Chat
            client={client}
            theme="str-chat__theme-light"
            i18nInstance={i18nInstance}
        >
            {children}
        </Chat>
    );
}
