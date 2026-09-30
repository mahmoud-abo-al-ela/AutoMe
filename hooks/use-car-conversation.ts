"use client";

import { useCallback, useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import type { Channel, ChannelFilters, ChannelSort } from "stream-chat";
import { startCarConversation } from "@/actions/stream-chat";
import { logError } from "@/lib/utils/errors";

const SORT: ChannelSort = [{ last_message_at: -1 }];

/**
 * The signed-in buyer's conversation about one car.
 *
 * Finds an existing conversation, or none: the channel is created by the first
 * message, not by opening the chat, so a buyer who opens it and leaves does
 * not put an empty conversation in the dealer's inbox.
 */
export function useCarConversation(carId: string | null) {
  const { client } = useChatContext();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setChannel(null);
    if (!carId || !client?.userID) return;

    let cancelled = false;
    setChecking(true);
    // car_id is a custom channel field this app sets, which Stream's closed
    // ChannelFilters union cannot express.
    const filters = {
      type: "messaging",
      members: { $in: [client.userID] },
      car_id: carId,
    } as unknown as ChannelFilters;

    client
      .queryChannels(filters, SORT, { limit: 1, watch: true, state: true })
      .then(([existing]) => {
        if (!cancelled) setChannel(existing ?? null);
      })
      .catch((error) => logError("Error finding the car conversation:", error))
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [carId, client]);

  /** Send a message, starting the conversation first if there is none. Throws on failure. */
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !carId) return;
      setSending(true);
      try {
        let target = channel;
        if (!target) {
          const result = await startCarConversation(carId);
          if (!result.success) throw result.error;
          target = client.channel(result.data.channelType, result.data.channelId);
          await target.watch();
          setChannel(target);
        }
        await target.sendMessage({ text: trimmed });
      } finally {
        setSending(false);
      }
    },
    [carId, channel, client]
  );

  return { channel, checking, sending, send };
}
