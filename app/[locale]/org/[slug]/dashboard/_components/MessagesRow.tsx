"use client";

import { useTranslations } from "next-intl";
import { OrgUnreadCount } from "@/components/StreamChat";
import { useFormatters } from "@/hooks/use-formatters";
import { CountBadge, OverviewRow } from "./OverviewRow";

/**
 * The unread-messages row. Unread counts live in the chat connection, not the
 * database, so this row fills in in the browser; until chat connects it says
 * it is checking rather than claiming zero.
 */
export function MessagesRow({ organizationId, href }: { organizationId: string; href: string }) {
  const t = useTranslations("org.dashboard.today.waitingList");
  const { number } = useFormatters();

  return (
    <OrgUnreadCount organizationId={organizationId}>
      {(count) => (
        <OverviewRow
          href={href}
          lead={<CountBadge value={count === null ? "–" : number(count)} urgent={!!count} />}
          title={t("messages")}
          detail={count === null ? t("messagesConnecting") : count > 0 ? t("messagesSome") : t("messagesNone")}
        />
      )}
    </OrgUnreadCount>
  );
}
