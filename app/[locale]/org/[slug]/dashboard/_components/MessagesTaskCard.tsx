"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { OrgUnreadCount } from "@/components/StreamChat";
import { useFormatters } from "@/hooks/use-formatters";
import { TaskCard } from "./TaskCard";

/**
 * The unread-messages card. Unread counts live in the chat connection, not
 * the database, so this one is filled in the browser; until chat connects it
 * says it is checking rather than claiming zero.
 */
export function MessagesTaskCard({ organizationId, href }: { organizationId: string; href: string }) {
  const t = useTranslations("org.dashboard.today.tasks.messages");
  const { number } = useFormatters();

  return (
    <OrgUnreadCount organizationId={organizationId}>
      {(count) => (
        <TaskCard
          href={href}
          icon={<MessageSquare />}
          count={count === null ? "–" : number(count)}
          title={t("title")}
          detail={count === null ? t("connecting") : count > 0 ? t("some") : t("empty")}
        />
      )}
    </OrgUnreadCount>
  );
}
