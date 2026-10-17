"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Channel, MessageInput, MessageList, Window } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { Car, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCarConversation } from "@/hooks/use-car-conversation";
import { useChatCar } from "@/hooks/use-chat-car";
import { useFormatters } from "@/hooks/use-formatters";
import { logError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils";
import { ChatMessage } from "../ChatMessage";
import { NoAttachmentSelector } from "../no-attachments";
import { ChatMessageStatus } from "../ChatMessageStatus";
import { useChatDock } from "./ChatDockContext";
import { DockHeader } from "./DockHeader";
import { DockStarter } from "./DockStarter";
import { QuickQuestions } from "./QuickQuestions";

/** Unread messages in a channel, kept current as they arrive and are read. */
function useUnread(channel: StreamChannel | null): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!channel) return setCount(0);
    const update = () => setCount(channel.countUnread());
    update();
    const subs = ["message.new", "message.read", "notification.mark_read"].map((e) =>
      channel.on(e as "message.new", update)
    );
    return () => subs.forEach((s) => s.unsubscribe());
  }, [channel]);
  return count;
}

const SPRING = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const WINDOW_ENTER = `motion-safe:animate-in fade-in duration-300 ${SPRING} max-sm:slide-in-from-bottom-10 sm:zoom-in-90 sm:slide-in-from-bottom-6`;
const WINDOW_EXIT =
  "motion-safe:animate-out fade-out duration-150 ease-in pointer-events-none max-sm:slide-out-to-bottom-10 sm:zoom-out-90 sm:slide-out-to-bottom-6";
const BUBBLE_ENTER =
  "motion-safe:animate-in fade-in zoom-in-75 slide-in-from-bottom-2 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const BUBBLE_EXIT = "motion-safe:animate-out fade-out zoom-out-75 duration-150 ease-in pointer-events-none";
const HOLD_LAST_FRAME = { animationFillMode: "forwards" } as const;
/** In case `animationend` never comes (a tab in the background, say). */
const EXIT_FALLBACK_MS = 400;

/**
 * Play the exit animation, then act — when the animation says it has ended,
 * not after a guessed delay — or act at once when motion is reduced.
 */
function useExit() {
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = useCallback(() => {
    clearTimeout(timer.current);
    const then = pending.current;
    pending.current = null;
    if (!then) return;
    setLeaving(false);
    then();
  }, []);

  const exit = useCallback(
    (then: () => void) => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return then();
      pending.current = then;
      setLeaving(true);
      timer.current = setTimeout(finish, EXIT_FALLBACK_MS);
    },
    [finish]
  );

  /** For the animated element: ends the exit on its own `exit` animation only. */
  const onAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target === e.currentTarget && e.animationName === "exit") finish();
    },
    [finish]
  );

  return { leaving, exit, onAnimationEnd };
}

export function ChatDock() {
  const { carId, close } = useChatDock();
  const pathname = usePathname();
  // The inbox is the full version of this window; both at once would be two
  // views of the same conversation fighting over "read".
  const onInbox = /\/messages$/.test(pathname);

  useEffect(() => {
    if (onInbox && carId) close();
  }, [onInbox, carId, close]);

  if (!carId || onInbox) return null;
  return <DockWindow key={carId} carId={carId} onCarPage={pathname.endsWith(`/cars/${carId}`)} />;
}

function DockWindow({ carId, onCarPage }: { carId: string; onCarPage: boolean }) {
  const t = useTranslations("chat.dock");
  const fmt = useFormatters();
  const { minimized, setMinimized, close } = useChatDock();
  const { channel, checking, sending, send } = useCarConversation(carId);
  const unread = useUnread(minimized ? channel : null);
  const { leaving, exit, onAnimationEnd } = useExit();
  const minimize = () => exit(() => setMinimized(true));
  const dismiss = () => exit(close);

  const car = useChatCar(carId);

  const trySend = async (text: string) => {
    try {
      await send(text);
      return true;
    } catch (error) {
      logError("Error sending a car chat message:", error);
      toast.error(t("sendFailed"));
      return false;
    }
  };

  if (minimized) {
    const image = car.data?.images?.[0]?.url;
    return (
      <div
        onAnimationEnd={onAnimationEnd}
        style={leaving ? HOLD_LAST_FRAME : undefined}
        className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] start-4 z-50 flex origin-left items-center gap-1 rounded-full border bg-background py-1 pe-1 ps-1 shadow-xl rtl:origin-right lg:bottom-4",
          leaving ? BUBBLE_EXIT : BUBBLE_ENTER
        )}
      >
        <button
          type="button"
          // Straight open, no exit first: the window then grows out of the
          // spot the bubble was in, which reads as the bubble opening.
          onClick={() => setMinimized(false)}
          className="flex cursor-pointer items-center gap-2 rounded-full pe-2"
          aria-label={t("expand")}
        >
          <span className="relative">
            <Avatar className="h-9 w-9">
              {image ? <AvatarImage src={image} alt="" className="object-cover" /> : null}
              <AvatarFallback className="bg-primary/10">
                <Car className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            {unread > 0 && (
              // Keyed on the count, so each new message pops the badge again.
              <span
                key={unread}
                className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white motion-safe:animate-in zoom-in-50 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              >
                {fmt.number(unread)}
              </span>
            )}
          </span>
          <span className="max-w-40 truncate text-sm font-medium">
            {car.data?.organization?.name ?? t("title")}
          </span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label={t("title")}
      onKeyDown={(e) => e.key === "Escape" && minimize()}
      onAnimationEnd={onAnimationEnd}
      style={leaving ? HOLD_LAST_FRAME : undefined}
      // Same bottom as the bubble at every width (below lg it clears the car
      // page's sticky bar and the phone tab bar), so it shrinks into the spot the bubble
      // then appears in.
      className={cn(
        "fixed inset-0 z-50 flex origin-bottom-left flex-col overflow-hidden bg-background shadow-2xl rtl:origin-bottom-right sm:inset-auto sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:start-4 sm:h-[min(600px,calc(100dvh-6rem))] sm:w-[380px] sm:rounded-2xl sm:border lg:bottom-4 lg:h-[min(600px,calc(100dvh-2rem))]",
        leaving ? WINDOW_EXIT : WINDOW_ENTER
      )}
    >
      {car.data ? (
        <DockHeader car={car.data} onCarPage={onCarPage} onMinimize={minimize} onClose={dismiss} />
      ) : (
        <div className="flex h-14 shrink-0 items-center justify-end border-b px-3">
          <button type="button" onClick={dismiss} className="cursor-pointer rounded-full p-1.5 hover:bg-muted" aria-label={t("close")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {car.isError ? (
        <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {t("carFailed")}
        </p>
      ) : !car.data || checking ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t("loading")} />
        </div>
      ) : channel ? (
        <div className="flex min-h-0 flex-1 flex-col [&_.str-chat]:h-full">
          <Channel channel={channel} Message={ChatMessage} AttachmentSelector={NoAttachmentSelector} MessageStatus={ChatMessageStatus}>
            <Window>
              <MessageList />
              {channel.state.messages.length === 0 && (
                <div className="px-3 pb-2">
                  <QuickQuestions car={car.data} disabled={sending} onPick={(q) => void trySend(q)} />
                </div>
              )}
              <MessageInput focus />
            </Window>
          </Channel>
        </div>
      ) : (
        <DockStarter car={car.data} sending={sending} onSend={trySend} />
      )}
    </section>
  );
}
