"use client";

import type { ReactNode } from "react";
import { useChatContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { ChatWindow } from "./ChatWindow";

/**
 * The inbox: the conversation list beside the open conversation on a desktop,
 * and one or the other on a phone — the list, then the conversation with a
 * back arrow (ConversationHeader), as WhatsApp does. Squeezing both into one
 * phone screen left neither usable.
 */
export function ChatInbox({ list }: { list: ReactNode }) {
  const { channel } = useChatContext();
  const open = Boolean(channel);

  return (
    <div className="grid h-[calc(100dvh-200px)] grid-cols-1 overflow-hidden rounded-lg border bg-card shadow-sm md:grid-cols-[380px_1fr]">
      <div className={cn("flex flex-col overflow-hidden border-e bg-background", open && "max-md:hidden")}>
        {list}
      </div>
      <div className={cn("flex flex-col overflow-hidden bg-background", !open && "max-md:hidden")}>
        <ChatWindow />
      </div>
    </div>
  );
}
