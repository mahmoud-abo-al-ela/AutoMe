import { createAuditLog } from "./audit";

/**
 * Organization audit log helpers
 */

interface AuditOrg {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
}

export async function logOrgCreated(org: AuditOrg, userId?: string | null, userEmail?: string | null) {
  return createAuditLog({
    action: "ORG_CREATED",
    entityType: "ORGANIZATION",
    entityId: org.id,
    organizationId: org.id,
    userId,
    userEmail,
    newValue: { name: org.name, slug: org.slug },
  });
}

export async function logOrgUpdated(org: AuditOrg, oldData: Record<string, unknown>, userId?: string | null, userEmail?: string | null) {
  return createAuditLog({
    action: "ORG_UPDATED",
    entityType: "ORGANIZATION",
    entityId: org.id,
    organizationId: org.id,
    userId,
    userEmail,
    oldValue: oldData,
    newValue: { name: org.name, slug: org.slug, isActive: org.isActive },
  });
}
