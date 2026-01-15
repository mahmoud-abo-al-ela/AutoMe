import { createAuditLog } from "./audit";

/**
 * Organization audit log helpers
 */

export async function logOrgCreated(org, userId, userEmail) {
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

export async function logOrgUpdated(org, oldData, userId, userEmail) {
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
