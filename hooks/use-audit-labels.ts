"use client";

import { useTranslations } from "next-intl";
import type { AuditAction, EntityType } from "@/lib/generated/prisma";

export const humanizeToken = (token: string) =>
  token
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function useAuditLabels() {
  const t = useTranslations("org.auditLogs");

  return {
    action: (action: AuditAction | string) =>
      t.has(`actions.${action}`) ? t(`actions.${action}`) : humanizeToken(action),
    entity: (entityType: EntityType | string) =>
      t.has(`entities.${entityType}`)
        ? t(`entities.${entityType}`)
        : humanizeToken(entityType),
  };
}
