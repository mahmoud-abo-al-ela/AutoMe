import { logError } from "@/lib/utils/errors";
import type { AuditAction, EntityType, Prisma } from "@/lib/generated/prisma";
import {
  createAuditLogEntry,
  getAuditLogs,
  getAllAuditLogs,
  cleanupExpiredAuditLogs,
} from "@/lib/repositories/audit";
import { getRequestMetadata, calculateRetentionDate } from "./metadata";
import * as organizationLogs from "./organization";
import * as carLogs from "./car";
import * as testDriveLogs from "./test-drive";
import * as membershipLogs from "./membership";
import * as subscriptionLogs from "./subscription";
import * as impersonationLogs from "./impersonation";
import * as settingsLogs from "./settings";

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
interface CreateAuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  organizationId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}

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
}: CreateAuditLogParams) {
  try {
    // Get request metadata
    const requestMetadata = await getRequestMetadata();

    // Calculate retention date
    const retainUntil = await calculateRetentionDate(organizationId);

    // Create the audit log entry
    const auditLog = await createAuditLogEntry({
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
    });

    return auditLog;
  } catch (error) {
    logError("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
}

/**
 * Record a super-admin action exactly as given: no request context and no
 * retention date are added, and — unlike createAuditLog — a failed write
 * throws to the caller. This is how the super-admin actions have always
 * logged; bringing them onto createAuditLog would change both.
 */
export async function recordAdminAuditEntry(entry: Prisma.AuditLogUncheckedCreateInput) {
  return createAuditLogEntry(entry);
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
  ...settingsLogs,
};

export { getAuditLogs, getAllAuditLogs, cleanupExpiredAuditLogs };

export default {
  createAuditLog,
  getAuditLogs,
  getAllAuditLogs,
  cleanupExpiredAuditLogs,
  ...auditHelpers,
};
