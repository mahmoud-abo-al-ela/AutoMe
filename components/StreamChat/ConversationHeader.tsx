"use client";

import { useTranslations } from "next-intl";
import { useChatContext } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { ArrowLeft, Building2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatCar } from "@/hooks/use-chat-car";
import { CarContactActions } from "./CarContactActions";
import { ChatCarSummary, ChatCarSummarySkeleton } from "./ChatCarSummary";

/**
 * Which side of a conversation the reader is on. A dealership conversation is
 * opened by the buyer (createCarInquiryChannel), so its creator is the buyer
 * and every other member is the dealership — the rule the translation service
 * uses too. The old check, "has a user_role", was true for every user.
 */
export function useConversationSide(channel: StreamChannel) {
  const { client } = useChatContext();
  const creatorId = channel.data?.created_by?.id;
  const members = Object.values(channel.state.members ?? {});
  const isDealer = Boolean(channel.data?.organization_id) && Boolean(creatorId) && creatorId !== client.userID;
  const buyer = members.find((m) => m.user?.id === creatorId)?.user;
  const other = isDealer ? buyer : members.find((m) => m.user?.id !== client.userID)?.user;
  return { isDealer, buyer, other };
}

/**
 * The top of an inbox conversation: back to the list on a phone, then the car
 * as it is now with the ways to act on it — or, for a conversation not about
 * one car, who it is with.
 */
export function ConversationHeader({ channel }: { channel: StreamChannel }) {
  const t = useTranslations("chat.window");
  const { setActiveChannel } = useChatContext();
  const { isDealer, buyer, other } = useConversationSide(channel);
  const carId = channel.data?.car_data?.id ?? channel.data?.car_id;
  const car = useChatCar(carId);
  const dealership = channel.data?.organization_data?.name;
  const buyerName = buyer?.name || t("buyer");

  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex items-start gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={() => setActiveChannel(undefined)}
          className="-ms-1 cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          aria-label={t("back")}
        >
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
        </button>

        {carId && car.isPending ? (
          <ChatCarSummarySkeleton
            image={channel.data?.car_data?.images?.[0] ?? channel.data?.car_data?.image}
            className="pb-3"
          />
        ) : car.data ? (
          <ChatCarSummary
            car={car.data}
            subtitle={isDealer ? t("withBuyer", { name: buyerName }) : car.data.organization?.name ?? dealership}
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 pb-3">
            <Avatar className="h-10 w-10 shrink-0">
              {/* The buyer sees the dealership, never a staff member (useDealershipSender). */}
              {(isDealer ? other?.image : channel.data?.organization_data?.logo) ? (
                <AvatarImage src={(isDealer ? other?.image : channel.data?.organization_data?.logo) ?? undefined} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/10">
                {isDealer ? <User className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
              </AvatarFallback>
            </Avatar>
            <p className="truncate text-sm font-semibold">
              {(isDealer ? buyerName : dealership ?? other?.name) || t("untitled")}
            </p>
          </div>
        )}
      </div>
      {car.data ? (
        <CarContactActions car={car.data} audience={isDealer ? "dealer" : "buyer"} className="px-3 py-2" />
      ) : null}
    </div>
  );
}
