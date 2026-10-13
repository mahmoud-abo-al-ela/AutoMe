"use client";

import { createContext, useContext } from "react";
import type { StreamChat } from "stream-chat";

/**
 * The Stream client once it is connected — set only where StreamChatProvider
 * renders <Chat>, so a non-null value means stream-chat-react's own hooks
 * (useChatContext) are inside their provider. Null while connecting, while
 * rendering on the server and when signed out: components that appear on
 * every page (the unread badges) check it before calling those hooks, which
 * otherwise log "useChatContext … outside of the ChatContext provider".
 */
export const ConnectedChatContext = createContext<StreamChat | null>(null);

export const useConnectedChat = () => useContext(ConnectedChatContext);
