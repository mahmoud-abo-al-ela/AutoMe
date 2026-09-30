"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ChatDockState {
  /** The car being discussed, or null when the dock is closed. */
  carId: string | null;
  minimized: boolean;
  openCarChat: (carId: string) => void;
  setMinimized: (minimized: boolean) => void;
  close: () => void;
}

const ChatDockContext = createContext<ChatDockState | null>(null);

/**
 * The floating chat's state, above every page so it survives navigation: a
 * buyer can keep a conversation open while browsing other cars, as in
 * Messenger. One car at a time — opening another replaces it.
 */
export function ChatDockProvider({ children }: { children: ReactNode }) {
  const [carId, setCarId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  const openCarChat = useCallback((id: string) => {
    setCarId(id);
    setMinimized(false);
  }, []);
  const close = useCallback(() => {
    setCarId(null);
    setMinimized(false);
  }, []);

  const value = useMemo(
    () => ({ carId, minimized, openCarChat, setMinimized, close }),
    [carId, minimized, openCarChat, close]
  );
  return <ChatDockContext.Provider value={value}>{children}</ChatDockContext.Provider>;
}

export function useChatDock(): ChatDockState {
  const context = useContext(ChatDockContext);
  if (!context) throw new Error("useChatDock must be used inside ChatDockProvider");
  return context;
}
