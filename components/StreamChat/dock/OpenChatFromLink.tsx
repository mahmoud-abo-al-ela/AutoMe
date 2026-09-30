"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useChatDock } from "./ChatDockContext";

/** The query a car page is sent back with when the reader asked to chat. */
export const OPEN_CHAT_PARAM = "chat";

/** The car page to come back to after signing in, with the chat to open. */
export function carChatReturnPath(carId: string): string {
  return `/cars/${carId}?${OPEN_CHAT_PARAM}=1`;
}

/**
 * Finishes a "chat with the dealer" click that had to go through sign-in: the
 * car page comes back with `?chat=1`, and this opens that car's chat once the
 * reader is signed in — then drops the parameter, so a refresh or a shared
 * link does not reopen it. Before, the click went to /messages, whose own
 * sign-in redirect carried no return address, and the reader landed on the
 * home page with neither the car nor the chat.
 */
export function OpenChatFromLink({ carId }: { carId: string }) {
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const { openCarChat } = useChatDock();
  const router = useRouter();
  const pathname = usePathname();
  const wantsChat = searchParams.get(OPEN_CHAT_PARAM) === "1";

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
