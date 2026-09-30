"use client";

import { useTranslations } from "next-intl";
import type { AuditAction, EntityType } from "@/lib/generated/prisma";

/**
 * Title-cases the raw enum member, e.g. `CAR_CREATED` -> "Car Created".
 *
 * Only a fallback: every member of both enums has a message, and
 * `i18n/audit-log-messages.test.ts` fails when one is added without. It stays
 * so a member added to the schema shows readable English in the meantime
 * rather than a raw `org.auditLogs.actions.…` key.
 */
export const humanizeToken = (token: string) =>
  token
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The action and entity columns render database enum members, so the stored
 * token stays English and only the label is translated — the same split the
 * car attributes use.
 */
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
