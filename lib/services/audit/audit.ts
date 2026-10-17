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

export async function recordAdminAuditEntry(entry: Prisma.AuditLogUncheckedCreateInput) {
  try {
    const { ipAddress, userAgent } = await getRequestMetadata();
    const given = entry.metadata && typeof entry.metadata === "object" ? (entry.metadata as Record<string, unknown>) : {};
    return await createAuditLogEntry({
      ...entry,
      retainUntil: null,
      metadata: JSON.parse(JSON.stringify({ ...given, ipAddress, userAgent })),
    });
  } catch (error) {
    logError("Failed to record a super-admin audit entry:", error);
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
