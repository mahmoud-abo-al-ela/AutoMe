import type { AuditAction, EntityType } from "@/lib/generated/prisma";
import { createAuditLog } from "./audit";
import type { AuditActor } from "./car";

export async function logSettingsChanged({
  action,
  entityType,
  organizationId,
  before,
  after,
  actor,
}: {
  action: Extract<AuditAction, "ORG_UPDATED" | "WORKING_HOURS_UPDATED" | "ORG_SETTINGS_UPDATED">;
  entityType: Extract<EntityType, "ORGANIZATION" | "WORKING_HOURS">;
  organizationId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  actor: AuditActor;
}) {
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const changed = Object.keys(after).filter((key) => !same(before[key], after[key]));
  if (changed.length === 0) return null;

  return createAuditLog({
    action,
    entityType,
    entityId: organizationId,
    organizationId,
    userId: actor.id,
    userEmail: actor.email,
    oldValue: Object.fromEntries(changed.map((key) => [key, before[key] ?? null])),
    newValue: Object.fromEntries(changed.map((key) => [key, after[key] ?? null])),
  });
}
