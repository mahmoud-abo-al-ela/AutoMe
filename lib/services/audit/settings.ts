import type { AuditAction, EntityType } from "@/lib/generated/prisma";
import { createAuditLog } from "./audit";
import type { AuditActor } from "./car";

/**
 * A dealership setting changed: its profile, opening hours or terms for
 * buyers. Only the keys whose value changed are stored, before and after, so
 * the Activity page can show "Wednesday closes 9 PM → 10 PM" rather than the
 * whole record. Nothing is logged when a save changed nothing.
 */
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
