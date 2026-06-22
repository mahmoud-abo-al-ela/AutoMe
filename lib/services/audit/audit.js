import { logError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";
import { getRequestMetadata, calculateRetentionDate } from "./metadata";
import {
  getAuditLogs,
  getAllAuditLogs,
  cleanupExpiredAuditLogs,
} from "./query";
import * as organizationLogs from "./organization";
import * as carLogs from "./car";
import * as testDriveLogs from "./test-drive";
import * as membershipLogs from "./membership";
import * as subscriptionLogs from "./subscription";
import * as impersonationLogs from "./impersonation";

/**
 * Audit log service for tracking all actions in the system
 * Supports automatic retention based on organization plan
 */

/**
 * Create an audit log entry
 * @param {Object} params
 * @param {string} params.action - AuditAction enum value
 * @param {string} params.entityType - EntityType enum value
 * @param {string} params.entityId - ID of the affected entity
 * @param {string} params.organizationId - Organization ID (optional for super admin actions)
 * @param {string} params.userId - User performing the action
 * @param {string} params.userEmail - Email of the user
 * @param {Object} params.oldValue - Previous state (for updates)
 * @param {Object} params.newValue - New state
 * @param {Object} params.metadata - Additional context (IP, userAgent, reason, etc.)
 */
export async function createAuditLog({
  action,
  entityType,
  entityId,
  organizationId,
  userId,
  userEmail,
  oldValue,
  newValue,
  metadata = {},
}) {
  try {
    // Get request metadata
    const requestMetadata = await getRequestMetadata();

    // Calculate retention date
    const retainUntil = await calculateRetentionDate(organizationId);

    // Create the audit log entry
    const auditLog = await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        organizationId,
        userId: requestMetadata.actualSuperAdminId || userId,
        userEmail,
        impersonatedBy: requestMetadata.impersonatedBy ? userId : null,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        retainUntil,
        metadata: {
          ...metadata,
          ipAddress: requestMetadata.ipAddress,
          userAgent: requestMetadata.userAgent,
          impersonationSessionId: requestMetadata.impersonationSessionId,
        },
      },
    });

    return auditLog;
  } catch (error) {
    logError("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
}

/**
 * Audit action helpers for common operations
 */
export const auditHelpers = {
  ...organizationLogs,
  ...carLogs,
  ...testDriveLogs,
  ...membershipLogs,
  ...subscriptionLogs,
  ...impersonationLogs,
};

export { getAuditLogs, getAllAuditLogs, cleanupExpiredAuditLogs };

export default {
  createAuditLog,
  getAuditLogs,
  getAllAuditLogs,
  cleanupExpiredAuditLogs,
  ...auditHelpers,
};
