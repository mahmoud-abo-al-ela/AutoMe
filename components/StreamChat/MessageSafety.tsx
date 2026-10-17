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
