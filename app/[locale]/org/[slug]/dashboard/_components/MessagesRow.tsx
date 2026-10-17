"use client";

import { useTranslations } from "next-intl";
import { OrgUnreadCount } from "@/components/StreamChat";
import { useFormatters } from "@/hooks/use-formatters";
import { CountBadge, OverviewRow } from "./OverviewRow";

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
