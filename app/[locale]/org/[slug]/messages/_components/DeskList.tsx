"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChannelList, useChatContext } from "stream-chat-react";
import type { Channel, ChannelFilters, ChannelSort } from "stream-chat";
import { MessageSquare, Search } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { getOrganizationMemberIds } from "@/actions/stream-chat";
import { logError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils";
import { DeskPreview, waitingOnDealer } from "./DeskPreview";

type Tab = "needsReply" | "unread" | "all";
const TABS: Tab[] = ["needsReply", "unread", "all"];
const SORT: ChannelSort = { last_message_at: -1 };
const OPTIONS = { limit: 30 };

/**
 * The conversations down the side of the desk (canvas: Messages round 1,
 * 2 · Sales desk). Opens on "Needs a reply" — buyers whose last word has no
 * answer yet — because answering fast is what sells the car. The tabs filter
 * what is already loaded, so they switch instantly and follow new messages
 * live; the open conversation stays listed after it is answered, so it does
 * not vanish from under the dealer.
 */
export function DeskList({ organizationSlug }: { organizationSlug: string }) {
  const t = useTranslations("org.messages");
  const { client, channel: active } = useChatContext();
  const [filters, setFilters] = useState<ChannelFilters | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("needsReply");
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const waitingCount = useWaitingCount(organizationId);
  const fmt = useFormatters();

  useEffect(() => {
    if (!client?.userID) return;
    getOrganizationMemberIds(organizationSlug)
      .then((result) => {
        if (!result.success) return setFailed(true);
        setOrganizationId(result.data.organizationId);
        // organization_id is a custom channel field, outside Stream's closed ChannelFilters union.
        setFilters({
          type: "messaging",
          members: { $in: result.data.memberIds },
          organization_id: result.data.organizationId,
        } as unknown as ChannelFilters);
      })
      .catch((error) => {
        logError("Loading the dealership's conversations failed", error);
        setFailed(true);
      });
  }, [client?.userID, organizationSlug]);

  const channelRenderFilterFn = useCallback(
    (channels: Channel[]) => {
      const query = search.trim().toLocaleLowerCase();
      const matches = (c: Channel) => !query || searchText(c).includes(query);
      const keep = tab === "all" ? () => true : tab === "unread" ? (c: Channel) => c.countUnread() > 0 : waitingOnDealer;
      return channels.filter((c) => (keep(c) && matches(c)) || c.cid === active?.cid);
    },
    [tab, search, active?.cid],
  );

  const Empty = useCallback(
    function DeskEmpty() {
      return (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-caption text-muted-foreground">
          <MessageSquare aria-hidden className="size-8 text-muted-foreground/50" />
          {t(`empty.${tab}`)}
        </div>
      );
    },
    [tab, t],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-h2 font-extrabold leading-tight">{t("title")}</h1>
          {waitingCount > 0 && (
            <span className="text-caption font-semibold text-[#8a5e00]">{t("waitingCount", { count: waitingCount, value: fmt.number(waitingCount) })}</span>
          )}
        </div>
        <label className="flex h-11 items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-[3px] focus-within:ring-ring/50">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <span className="sr-only">{t("search")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search")}
            className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div role="tablist" aria-label={t("tabs.label")} className="flex gap-1.5">
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "h-9 cursor-pointer whitespace-nowrap rounded-full px-3.5 text-caption font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                tab === value ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-field hover:bg-muted",
              )}
            >
              {t(`tabs.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {failed ? (
          <p role="alert" className="px-4 py-6 text-caption">
            {t("loadFailed")}
          </p>
        ) : filters ? (
          <ChannelList
            filters={filters}
            sort={SORT}
            options={OPTIONS}
            Preview={(props) => <DeskPreview channel={props.channel} setActiveChannel={props.setActiveChannel} activeChannel={props.activeChannel} />}
            setActiveChannelOnMount={false}
            channelRenderFilterFn={channelRenderFilterFn}
            EmptyStateIndicator={Empty}
          />
        ) : (
          <ul aria-busy className="flex flex-col">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex gap-3 border-b border-border px-4 py-3">
                <span className="skeleton-shimmer size-11 rounded-full" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="skeleton-shimmer h-4 w-2/3 rounded" />
                  <span className="skeleton-shimmer h-3 w-1/2 rounded" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** What a conversation is found by: the buyer's name and the car's title. */
function searchText(channel: Channel) {
  const buyerId = channel.data?.created_by?.id;
  const buyer = Object.values(channel.state.members ?? {}).find((member) => member.user?.id === buyerId)?.user?.name ?? "";
  const car = channel.data?.car_data?.title ?? "";
  return `${buyer} ${car}`.toLocaleLowerCase();
}

/**
 * How many of the dealership's conversations wait on it, counted over the
 * ones loaded and kept current as messages arrive.
 */
function useWaitingCount(organizationId: string | null) {
  const { client } = useChatContext();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!organizationId) return;
    const recount = () =>
      setCount(Object.values(client.activeChannels).filter((c) => c.data?.organization_id === organizationId && waitingOnDealer(c)).length);
    recount();
    const subscription = client.on((event) => {
      if (event.type === "message.new" || event.type === "channels.queried" || event.type === "notification.message_new") recount();
    });
    return () => subscription.unsubscribe();
  }, [client, organizationId]);
  return count;
}
