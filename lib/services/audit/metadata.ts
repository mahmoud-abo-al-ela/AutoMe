import { headers } from "next/headers";
import { findAuditRetentionDays } from "@/lib/repositories/audit";
import { resolveActiveImpersonation } from "@/lib/services/impersonation/active";

/**
 * Get request metadata (IP, user agent, impersonation info)
 */
export async function getRequestMetadata() {
  const headersList = await headers();
  
  const ipAddress = headersList.get("x-forwarded-for") || 
                    headersList.get("x-real-ip") || 
                    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";
  
  // Impersonation only as the database verifies it — the request's own
  // cookies and headers say nothing about who is really acting.
  const impersonation = await resolveActiveImpersonation();

  return {
    ipAddress,
    userAgent,
    impersonatedBy: impersonation?.targetUserId ?? null,
    actualSuperAdminId: impersonation?.superAdmin.id ?? null,
    impersonationSessionId: impersonation?.sessionId ?? null,
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
