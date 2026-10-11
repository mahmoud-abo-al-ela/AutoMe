import { headers } from "next/headers";
import { findAuditRetentionDays } from "@/lib/repositories/audit";
import { findSessionSuperAdminId } from "@/lib/repositories/impersonation";

/**
 * Get request metadata (IP, user agent, impersonation info)
 */
export async function getRequestMetadata() {
  const headersList = await headers();
  
  const ipAddress = headersList.get("x-forwarded-for") || 
                    headersList.get("x-real-ip") || 
                    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";
  
  // Check for impersonation
  const impersonatedBy = headersList.get("x-impersonation-active") === "true"
    ? headersList.get("x-impersonated-user")
    : null;

  // Get actual super admin ID if impersonating
  let actualSuperAdminId: string | null | undefined = null;
  if (impersonatedBy) {
    const sessionId = headersList.get("x-impersonation-session");
    if (sessionId) {
      actualSuperAdminId = await findSessionSuperAdminId(sessionId);
    }
  }

  return {
    ipAddress,
    userAgent,
    impersonatedBy,
    actualSuperAdminId,
    impersonationSessionId: impersonatedBy 
      ? headersList.get("x-impersonation-session") 
      : null,
  };
}

/**
 * Calculate retention date based on organization plan
 */
export async function calculateRetentionDate(organizationId?: string | null) {
  if (!organizationId) {
    return null;
  }

  const retentionDays = await findAuditRetentionDays(organizationId);
  
  if (retentionDays !== null && retentionDays !== undefined) {
    const retainUntil = new Date();
    retainUntil.setDate(retainUntil.getDate() + retentionDays);
    return retainUntil;
  }
  
  // null retentionDays means unlimited (Enterprise)
  return null;
}
