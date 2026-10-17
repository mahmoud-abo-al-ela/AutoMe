"use client";

import { createContext, useContext } from "react";
import type { StreamChat } from "stream-chat";

export const ConnectedChatContext = createContext<StreamChat | null>(null);

export const useConnectedChat = () => useContext(ConnectedChatContext);
