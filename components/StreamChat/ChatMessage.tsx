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
import { currentFlag } from "@/lib/utils/chat-moderation";
import { useDealershipSender } from "./useDealershipSender";
import { FlagNotice, FlagProvider, FlaggedText, useFlagHidesText, useFlagState } from "./MessageSafety";

interface ToggleState {
  showing: boolean;
  pending: boolean;
  error: ActionError | undefined;
  toggle: () => void;
}

const ToggleContext = createContext<ToggleState | null>(null);

function TranslateToggle() {
  const t = useTranslations("chat.translation");
  const state = useContext(ToggleContext);
  const hidden = useFlagHidesText();
  if (!state || hidden) return null;

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

function withChrome(text?: string, mentioned?: UserResponse[], options?: RenderTextOptions): ReactNode {
  return (
    <>
      <FlagNotice />
      <div dir="auto">
        <FlaggedText plain={text ?? ""}>{defaultRenderText(text, mentioned, options)}</FlaggedText>
      </div>
      <TranslateToggle />
    </>
  );
}

export function ChatMessage(props: MessageUIComponentProps) {
  const { message, isMyMessage } = useMessageContext("ChatMessage");
  const { userLanguage } = useTranslationContext("ChatMessage");
  const asSeen = useDealershipSender();
  const locale = useLocale() as Locale;
  const [showing, setShowing] = useState(false);
  const [fetched, setFetched] = useState<{ source: string; text: string } | null>(null);

  const text = message.text?.trim() ?? "";
  const theirs = !isMyMessage() && message.type === "regular" && text.length > 0;
  const offered = theirs && isTranslatable(text, locale);
  const flag = useFlagState(theirs ? currentFlag(message.safety_flag, text) : null);
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

  const shown = useMemo(
    () =>
      asSeen({
        ...(toggle.showing && translation
          ? {
              ...message,
              text: translation,
              i18n: {
                ...message.i18n,
                [`${userLanguage}_text`]: translation,
                language: message.i18n?.language ?? userLanguage,
              },
            }
          : message),
        attachments: [],
      }),
    [asSeen, toggle.showing, translation, message, userLanguage]
  );

  if (!theirs) return <MessageSimple {...props} message={shown} />;
  return (
    <FlagProvider value={flag}>
      <ToggleContext.Provider value={offered ? toggle : null}>
        <MessageSimple {...props} message={shown} renderText={withChrome} />
      </ToggleContext.Provider>
    </FlagProvider>
  );
}
