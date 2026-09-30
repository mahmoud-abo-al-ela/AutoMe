"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MessageSquare, Send } from "lucide-react";
import type { CarDetail } from "@/app/[locale]/(site)/cars/[id]/_lib/car-detail-types";
import { QuickQuestions } from "./QuickQuestions";

/**
 * The dock before a conversation exists: an invitation, one-tap questions and
 * a box. The first message sent here creates the conversation, after which
 * Stream's own list and input take over.
 */
export function DockStarter({
  car,
  sending,
  onSend,
}: {
  car: CarDetail;
  sending: boolean;
  onSend: (text: string) => Promise<boolean>;
}) {
  const t = useTranslations("chat.dock");
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = async (value: string) => {
    if (!value.trim() || sending) return;
    if (await onSend(value)) setText("");
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(text);
  };
  // Enter sends, Shift+Enter breaks the line — as in every chat app.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit(text);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <p className="text-sm font-semibold">
          {t("startTitle", { dealer: car.organization?.name ?? t("theDealer") })}
        </p>
        <p className="text-xs text-muted-foreground">{t("startBody")}</p>
      </div>

      <div className="space-y-2 border-t p-3">
        <QuickQuestions car={car} disabled={sending} onPick={(q) => void submit(q)} />
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            disabled={sending}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border text-start [unicode-bidi:plaintext] bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label={t("send")}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 rtl:-scale-x-100" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
