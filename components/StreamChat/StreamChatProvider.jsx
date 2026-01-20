"use client";

import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import { useUser } from "@clerk/nextjs";
import { getStreamToken } from "@/actions/stream-chat";

import "stream-chat-react/dist/css/v2/index.css";

let chatClient = null;

export function StreamChatProvider({ children }) {
    const { user: clerkUser, isLoaded } = useUser();
    const [client, setClient] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);

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
                    console.error("Failed to get Stream token:", result.error);
                    setIsConnecting(false);
                    return;
                }

                const { token, userId, apiKey } = result.data;

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
                console.error("Error initializing Stream Chat:", error);
            } finally {
                setIsConnecting(false);
            }
        };

        initChat();

        // Cleanup on unmount
        return () => {
            if (chatClient && chatClient.userID) {
                chatClient.disconnectUser().catch(console.error);
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
        <Chat client={client} theme="str-chat__theme-light">
            {children}
        </Chat>
    );
}
