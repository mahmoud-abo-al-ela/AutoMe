"use client";

import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { DeskList } from "./DeskList";
import { DeskConversation } from "./DeskConversation";
import { DealPanel } from "./DealPanel";

/**
 * Messages as a sales desk (canvas: Messages round 1, 2 · Sales desk): the
 * conversations, the open one, and the deal beside it — three columns on a
 * wide screen, the deal moving into a sheet below that, and on a phone one
 * screen at a time: the list, then the conversation with a back arrow.
 */
export function SalesDesk({ organizationSlug, base }: { organizationSlug: string; base: string }) {
  const t = useTranslations("org.messages");
  const { channel } = useChatContext();
  const open = Boolean(channel);

  return (
    <div
      className={cn(
        "sales-desk grid h-[calc(100dvh-9rem)] min-h-[32rem] grid-cols-1 overflow-hidden rounded-sheet border border-border bg-card",
        "lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px]",
        // On a phone the desk fills the screen under the top bar.
        "max-md:-mx-4 max-md:-mb-16 max-md:-mt-6 max-md:h-[calc(100dvh-60px)] max-md:rounded-none max-md:border-x-0",
      )}
    >
      <section aria-label={t("listLabel")} className={cn("min-h-0 border-e border-border", open && "max-lg:hidden")}>
        <DeskList organizationSlug={organizationSlug} />
      </section>
      <section className={cn("flex min-h-0 flex-col bg-[#fbf8f2]", !open && "max-lg:hidden")}>
        <DeskConversation base={base} />
      </section>
      <aside aria-label={t("deal.title")} className="hidden min-h-0 border-s border-border xl:flex xl:flex-col">
        {channel ? <DealPanel key={channel.cid} channel={channel} base={base} className="flex-1" /> : null}
      </aside>
    </div>
  );
}
