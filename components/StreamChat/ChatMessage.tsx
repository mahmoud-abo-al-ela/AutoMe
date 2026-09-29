"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import {
  MessageSimple,
  renderText as defaultRenderText,
  useMessageContext,
  useTranslationContext,
  type MessageUIComponentProps,
  type RenderTextOptions,
} from "stream-chat-react";
import type { UserResponse } from "stream-chat";
import { Languages } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { translateChatMessageAction } from "@/actions/chat-translation";
import { ActionErrorText } from "@/components/ActionErrorText";
import { currentTranslation, isTranslatable } from "@/lib/utils/chat-translation";
import type { ActionError } from "@/lib/utils/error-messages";
import { useDealershipSender } from "./useDealershipSender";

interface ToggleState {
  showing: boolean;
  pending: boolean;
  error: ActionError | undefined;
  toggle: () => void;
}

/**
 * The toggle sits inside the bubble, under the text, where the reader is
 * looking. It is rendered through `renderText`, which Stream memoises on the
 * text alone — so it reads its state from this context instead of props, or
 * it would never re-render.
 */
const ToggleContext = createContext<ToggleState | null>(null);

function TranslateToggle() {
  const t = useTranslations("chat.translation");
  const state = useContext(ToggleContext);
  if (!state) return null;

  const label = state.pending ? t("translating") : state.showing ? t("showOriginal") : t("translate");
  // One short line: a label that wraps widens the bubble past its text.
  return (
    <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
      {state.showing && (
        <span title={t("translatedByAi")} className="inline-flex items-center gap-1">
          <Languages className="h-3 w-3" aria-hidden />
          {t("translated")} ·
        </span>
      )}
      <button
        type="button"
        onClick={state.toggle}
        disabled={state.pending}
        className="inline-flex cursor-pointer items-center gap-1 underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {!state.showing && <Languages className="h-3 w-3" aria-hidden />}
        {label}
      </button>
      {state.error && (
        <span className="mt-0.5 block text-destructive" role="alert">
          <ActionErrorText error={state.error} fallback={t("failed")} />
        </span>
      )}
    </span>
  );
}

/** Text in its own direction: an English message in an Arabic page, and the reverse. */
function withToggle(text?: string, mentioned?: UserResponse[], options?: RenderTextOptions): ReactNode {
  return (
    <>
      <div dir="auto">{defaultRenderText(text, mentioned, options)}</div>
      <TranslateToggle />
    </>
  );
}

/**
 * Every chat message, as this app draws it on top of Stream's own:
 *
 * - "Translate" under a message written in the other language — Egyptian
 *   Arabic for a reader browsing in English, English for one browsing in
 *   Arabic. Nothing is translated until someone taps (owner's decision); the
 *   translation is saved on the message by the server, so the next tap, by
 *   either member, is instant. The original is always one tap away.
 * - A dealership's replies shown to the buyer under the dealership's name and
 *   logo, not the staff member's (useDealershipSender).
 */
export function ChatMessage(props: MessageUIComponentProps) {
  const { message, isMyMessage } = useMessageContext("ChatMessage");
  const { userLanguage } = useTranslationContext("ChatMessage");
  const asSeen = useDealershipSender();
  const locale = useLocale() as Locale;
  const [showing, setShowing] = useState(false);
  const [fetched, setFetched] = useState<{ source: string; text: string } | null>(null);

  const text = message.text?.trim() ?? "";
  const offered = !isMyMessage() && message.type === "regular" && isTranslatable(text, locale);
  const translation =
    currentTranslation(message.translations, text, locale) ??
    (fetched?.source === text ? fetched.text : null);

  const translate = useMutation({
    mutationFn: async () => {
      const response = await translateChatMessageAction({ messageId: message.id, target: locale });
      if (!response.success) throw response.error;
      return response.data.text;
    },
    onSuccess: (translated) => {
      setFetched({ source: text, text: translated });
      setShowing(true);
    },
  });

  const toggle = useMemo<ToggleState>(
    () => ({
      showing: showing && translation !== null,
      pending: translate.isPending,
      error: (translate.error ?? undefined) as unknown as ActionError | undefined,
      toggle: () => {
        if (translation !== null) setShowing((s) => !s);
        else translate.mutate();
      },
    }),
    [showing, translation, translate]
  );

  // Stream's MessageText shows i18n[<reader's language>_text] over the text.
  // `text` is swapped too: Stream memoises each message and re-renders it only
  // when fields like `text` or `updated_at` change — never `i18n` — so with
  // i18n alone the label changed and the words did not. This copy is only
  // what is drawn; the message itself is untouched.
  const shown = useMemo(
    () =>
      asSeen(
        toggle.showing && translation
          ? {
              ...message,
              text: translation,
              i18n: {
                ...message.i18n,
                [`${userLanguage}_text`]: translation,
                language: message.i18n?.language ?? userLanguage,
              },
            }
          : message
      ),
    [asSeen, toggle.showing, translation, message, userLanguage]
  );

  if (!offered) return <MessageSimple {...props} message={shown} />;
  return (
    <ToggleContext.Provider value={toggle}>
      <MessageSimple {...props} message={shown} renderText={withToggle} />
    </ToggleContext.Provider>
  );
}
