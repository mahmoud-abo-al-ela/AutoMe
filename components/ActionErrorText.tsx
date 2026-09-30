"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import type { ActionError } from "@/lib/utils/error-messages";

/**
 * Seconds left of `retryAfter`, ticking down once a second from the moment
 * this error arrived. A new error — even with the same wait — starts over.
 */
function useCountdown(retryAfter: number | undefined, error: ActionError | undefined): number {
  const [left, setLeft] = useState(retryAfter ?? 0);

  useEffect(() => {
    if (retryAfter === undefined) return;
    const end = Date.now() + retryAfter * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remaining);
      return remaining;
    };
    tick();
    const id = setInterval(() => {
      if (tick() === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter, error]);

  return left;
}

/**
 * An action's error as the user reads it. A rate limit that says how long to
 * wait is shown as a live countdown — "try again in 0:42" — and then as
 * "you can try again now", instead of an open-ended "wait a moment".
 */
export function ActionErrorText({ error, fallback }: { error?: ActionError; fallback?: string }) {
  const t = useTranslations("errors");
  const actionError = useActionError();
  const { number } = useFormatters();
  const retryAfter = error?.code === "RATE_LIMIT_EXCEEDED" ? error.retryAfter : undefined;
  const left = useCountdown(retryAfter, error);

  if (retryAfter === undefined) return <>{actionError(error, fallback)}</>;
  if (left === 0) return <>{t("rateLimitReady")}</>;

  const time = `${number(Math.floor(left / 60))}:${number(left % 60, { minimumIntegerDigits: 2 })}`;
  // A timer, and explicitly not live — even inside a live region such as the
  // assistant's chat, where a screen reader would otherwise read every tick.
  return (
    <span role="timer" aria-live="off">
      {t("rateLimitIn", { time })}
    </span>
  );
}
