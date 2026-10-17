"use client";

import { useCallback } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import type { LocalMessage } from "stream-chat";
import { useChatCar } from "@/hooks/use-chat-car";

export function useDealershipSender() {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext("useDealershipSender");
  const data = channel?.data;
  const creatorId = data?.created_by?.id;
  const viewerIsBuyer = Boolean(data?.organization_id) && Boolean(creatorId) && creatorId === client.userID;
  const car = useChatCar(viewerIsBuyer ? (data?.car_data?.id ?? data?.car_id) : null);

  const name = car.data?.organization?.name ?? data?.organization_data?.name;
  const logo = car.data?.organization?.logo ?? data?.organization_data?.logo ?? undefined;

  return useCallback(
    (message: LocalMessage): LocalMessage => {
      const author = message.user;
      if (!viewerIsBuyer || !name || !author || author.id === creatorId) return message;
      return {
        ...message,
        user: {
          ...author,
          name,
          image: logo,
          // Stream redraws a message only when fields like the author's
          // updated_at change; the logo can arrive after the first draw.
          updated_at: `dealership:${logo ?? ""}`,
        },
      };
    },
    [viewerIsBuyer, name, logo, creatorId]
  );
}
