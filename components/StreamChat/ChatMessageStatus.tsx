"use client";

import { useTranslations } from "next-intl";
import { MessageStatus, type MessageStatusProps } from "stream-chat-react";
import { CheckCheck } from "lucide-react";

/** Read: a blue double tick, as WhatsApp shows it. */
function SeenTicks() {
  const t = useTranslations("chat.status");
  return (
    <span className="inline-flex text-sky-600" title={t("seen")} role="img" aria-label={t("seen")}>
      <CheckCheck className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

/**
 * Stream's delivery status with the read state drawn as ticks. Stream's own
 * read state is the reader's avatar — for a buyer that was the photo of the
 * staff member who read it, which the dealership-as-sender rule
 * (useDealershipSender) otherwise hides — and ticks are what people read at
 * a glance anyway. Pass as `MessageStatus` to every `<Channel>`.
 */
export function ChatMessageStatus(props: MessageStatusProps) {
  return <MessageStatus {...props} MessageReadStatus={SeenTicks} />;
}
