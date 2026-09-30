"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { EyeOff, TriangleAlert } from "lucide-react";
import { flagDisplay, type FlagCategory } from "@/lib/utils/chat-moderation";

interface FlagState {
  category: FlagCategory;
  revealed: boolean;
  reveal: () => void;
}

/**
 * The flag on the message being drawn, for the pieces rendered through
 * Stream's `renderText` — which Stream memoises on the text alone, while the
 * flag arrives later on the same text. Read from context, they redraw anyway
 * (the same reason the translate toggle does).
 */
const FlagContext = createContext<FlagState | null>(null);

export function useFlagState(category: FlagCategory | null): FlagState | null {
  const [revealed, setRevealed] = useState(false);
  return useMemo(
    () => (category ? { category, revealed, reveal: () => setRevealed(true) } : null),
    [category, revealed]
  );
}

export const FlagProvider = FlagContext.Provider;

/** True while an abusive message is still hidden — the translate toggle steps aside. */
export function useFlagHidesText(): boolean {
  const flag = useContext(FlagContext);
  return Boolean(flag && flagDisplay(flag.category) === "hide" && !flag.revealed);
}

/**
 * Above a scam or spam message: a warning, the message still readable
 * beneath it (owner's choice — a wrong flag must never cost the reader a real
 * message).
 */
export function FlagNotice() {
  const t = useTranslations("chat.safety");
  const flag = useContext(FlagContext);
  if (!flag || flagDisplay(flag.category) !== "warn") return null;
  return (
    <span className="mb-1.5 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900">
      <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      {flag.category === "scam" ? t("scamWarning") : t("spamWarning")}
    </span>
  );
}

/**
 * A flagged message's text. Abuse is hidden until the reader chooses to see
 * it. Any flagged message — once shown — is drawn as plain text, links not
 * clickable: a scam or spam link was the one thing in the bubble a reader
 * could act on, and it sat above its own warning. `plain` is the raw text;
 * `children` is Stream's rendering (markdown, clickable links) for everything
 * that is not flagged.
 */
export function FlaggedText({ children, plain }: { children: ReactNode; plain: string }) {
  const t = useTranslations("chat.safety");
  const flag = useContext(FlagContext);
  if (!flag) return <>{children}</>;
  if (flagDisplay(flag.category) !== "hide" || flag.revealed) {
    return <p className="whitespace-pre-wrap">{plain}</p>;
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm italic text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <EyeOff className="h-3.5 w-3.5" aria-hidden />
        {t("hidden")}
      </span>
      <button
        type="button"
        onClick={flag.reveal}
        className="cursor-pointer text-xs font-medium not-italic text-primary underline-offset-2 hover:underline"
      >
        {t("show")}
      </button>
    </span>
  );
}
