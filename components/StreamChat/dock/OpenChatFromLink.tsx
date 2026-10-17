"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useChatDock } from "./ChatDockContext";
import { useBuyerAccess } from "@/components/BuyerAccess";

/** The query a car page is sent back with when the reader asked to chat. */
export const OPEN_CHAT_PARAM = "chat";

/** The car page to come back to after signing in, with the chat to open. */
export function carChatReturnPath(carId: string): string {
  return `/cars/${carId}?${OPEN_CHAT_PARAM}=1`;
}

export function OpenChatFromLink({ carId }: { carId: string }) {
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const { openCarChat } = useChatDock();
  const router = useRouter();
  const pathname = usePathname();
  // A shared ?chat=1 link must not open a chat the viewer may not start.
  const mayMessage = useBuyerAccess().can("message");
  const wantsChat = searchParams.get(OPEN_CHAT_PARAM) === "1" && mayMessage;

  useEffect(() => {
    if (!wantsChat || !isSignedIn) return;
    openCarChat(carId);
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete(OPEN_CHAT_PARAM);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [wantsChat, isSignedIn, carId, openCarChat, router, pathname, searchParams]);

  return null;
}
