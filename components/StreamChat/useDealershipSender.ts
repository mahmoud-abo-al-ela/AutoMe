"use client";

import { useCallback } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import type { LocalMessage } from "stream-chat";
import { useChatCar } from "@/hooks/use-chat-car";

/**
 * Who a buyer sees on a dealership's replies: the dealership — its name and
 * logo — not the staff member who typed them, as a business account shows on
 * WhatsApp or Messenger (owner's choice, 2026-09-29). The buyer is talking to
 * the showroom; which salesperson answered is the showroom's business. Staff
 * still see each other's own names in their inbox.
 *
 * The buyer is the conversation's creator (see useConversationSide); every
 * other author in a dealership conversation is the dealership. The logo is
 * saved on conversations started since this change; older ones take it from
 * the live car, which the chat header loads anyway.
 */
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
