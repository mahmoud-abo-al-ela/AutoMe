"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import type { Channel } from "stream-chat";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread";

/**
 * All / Unread above a conversation list. Unread is a filter over the
 * conversations already loaded, not a new query — cheap, and it updates live
 * as messages arrive. The open conversation stays listed after it is read, so
 * it does not vanish from under the reader.
 */
export function useInboxTabs() {
  const t = useTranslations("chat.tabs");
  const { channel: active } = useChatContext();
  const [tab, setTab] = useState<Tab>("all");

  const channelRenderFilterFn = useCallback(
    (channels: Channel[]) =>
      tab === "all" ? channels : channels.filter((c) => c.countUnread() > 0 || c.cid === active?.cid),
    [tab, active?.cid]
  );

  const tabs = (
    <div role="tablist" aria-label={t("label")} className="flex shrink-0 gap-1.5 border-b px-3 py-2">
      {(["all", "unread"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          onClick={() => setTab(value)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
            tab === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          )}
        >
          {t(value)}
        </button>
      ))}
    </div>
  );

  const EmptyStateIndicator = useCallback(
    function InboxEmpty() {
      return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
          <MessageSquare className="h-8 w-8 text-primary/40" aria-hidden />
          {tab === "unread" ? t("emptyUnread") : t("empty")}
        </div>
      );
    },
    [tab, t]
  );

  return { tabs, channelRenderFilterFn, EmptyStateIndicator };
}
