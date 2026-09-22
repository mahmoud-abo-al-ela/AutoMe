import type { AuditLog, User } from "@/lib/generated/prisma";

/**
 * `lib/services/audit/query.js` stays JavaScript by design — it builds its
 * `where` clause dynamically — so its return type does not survive the
 * boundary. These declare what it actually hands back.
 */
export type AuditLogWithUser = AuditLog & {
  user: Pick<User, "name" | "email" | "imageUrl"> | null;
};

export interface AuditLogsPageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** The subset of filters the org-side page exposes. */
export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}
