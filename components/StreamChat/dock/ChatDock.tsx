"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Channel, MessageInput, MessageList, Window } from "stream-chat-react";
import type { Channel as StreamChannel } from "stream-chat";
import { Car, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getCarById } from "@/actions/cars-listing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCarConversation } from "@/hooks/use-car-conversation";
import { useFormatters } from "@/hooks/use-formatters";
import { queryKeys } from "@/lib/query-client";
import { logError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils";
import { TranslatableMessage } from "../TranslatableMessage";
import { NoAttachmentSelector } from "../no-attachments";
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

/**
 * Motion. The window grows out of its corner — where the bubble sits — with a
 * soft overshoot, and shrinks back into it; on a phone, where it is the whole
 * screen, it slides up and down instead. `motion-safe:` drops all of it for a
 * reader who asked their system for less motion, and `useExit` then acts at
 * once rather than waiting for an animation that will not play.
 */
const SPRING = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const WINDOW_ENTER = `motion-safe:animate-in fade-in duration-300 ${SPRING} max-sm:slide-in-from-bottom-10 sm:zoom-in-90 sm:slide-in-from-bottom-6`;
const WINDOW_EXIT =
  "motion-safe:animate-out fade-out duration-150 ease-in pointer-events-none max-sm:slide-out-to-bottom-10 sm:zoom-out-90 sm:slide-out-to-bottom-6";
const BUBBLE_ENTER =
  "motion-safe:animate-in fade-in zoom-in-75 slide-in-from-bottom-2 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const BUBBLE_EXIT = "motion-safe:animate-out fade-out zoom-out-75 duration-150 ease-in pointer-events-none";
/**
 * Holds the exit's last frame. Inline, not the `fill-mode-forwards` class:
 * Tailwind emits `motion-safe:animate-out` after it, and that rule's
 * `animation` shorthand resets the fill mode — so the window snapped back to
 * full size for a frame before the bubble replaced it.
 */
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

/**
 * The floating chat about one car — Messenger-style: a window docked in the
 * reading-start corner (left in English, right in Arabic — the owner's choice)
 * on larger screens, so the buyer keeps looking at the car while they
 * talk, and the whole screen on a phone. Minimised it becomes a pill with the
 * unread count; it stays open across pages until closed.
 */
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

  const car = useQuery({
    queryKey: queryKeys.cars.chat(carId),
    queryFn: async () => {
      const response = await getCarById(carId);
      if (!response.success) throw response.error;
      return response.data;
    },
    staleTime: 30_000,
  });

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
          "fixed bottom-20 start-4 z-50 flex origin-left items-center gap-1 rounded-full border bg-background py-1 pe-1 ps-1 shadow-xl rtl:origin-right lg:bottom-4",
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
      // Same bottom as the bubble at every width (bottom-20 clears the car
      // page's sticky bar below lg), so it shrinks into the spot the bubble
      // then appears in.
      className={cn(
        "fixed inset-0 z-50 flex origin-bottom-left flex-col overflow-hidden bg-background shadow-2xl rtl:origin-bottom-right sm:inset-auto sm:bottom-20 sm:start-4 sm:h-[min(600px,calc(100dvh-6rem))] sm:w-[380px] sm:rounded-2xl sm:border lg:bottom-4 lg:h-[min(600px,calc(100dvh-2rem))]",
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
          <Channel channel={channel} Message={TranslatableMessage} AttachmentSelector={NoAttachmentSelector}>
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
