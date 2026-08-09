import { headers } from "next/headers";
import { db } from "@/lib/prisma";

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
      const session = await db.impersonationSession.findUnique({
        where: { id: sessionId },
        select: { superAdminId: true },
      });
      actualSuperAdminId = session?.superAdminId;
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

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });

  const retentionDays = org?.subscription?.plan?.auditLogRetentionDays;
  
  if (retentionDays !== null && retentionDays !== undefined) {
    const retainUntil = new Date();
    retainUntil.setDate(retainUntil.getDate() + retentionDays);
    return retainUntil;
  }
  
  // null retentionDays means unlimited (Enterprise)
  return null;
}
