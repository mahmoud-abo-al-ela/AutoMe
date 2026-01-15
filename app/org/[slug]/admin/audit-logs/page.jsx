import { checkUser } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { getAuditLogs } from "@/lib/services/audit/audit";
import AuditLogsHeader from "./_components/AuditLogsHeader";
import AuditLogsTable from "./_components/AuditLogsTable";
import AuditLogsFilters from "./_components/AuditLogsFilters";

export default async function AuditLogsPage({ searchParams }) {
  const user = await checkUser();
  const organization = await getCurrentOrganization();

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  if (!isOwner) {
    notFound();
  }

  // Parse search params
  const params = await searchParams;
  const page = parseInt(params?.page) || 1;
  const action = params?.action || "";
  const entityType = params?.entityType || "";
  const userId = params?.userId || "";

  // Build filters
  const filters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (userId) filters.userId = userId;

  // Get audit logs
  const { logs, pagination } = await getAuditLogs(organization.id, {
    page,
    limit: 25,
    filters,
  });

  return (
    <div className="space-y-6">
      <AuditLogsHeader retentionInfo={organization.subscription?.plan} />

      <AuditLogsFilters currentFilters={{ action, entityType, userId }} />

      <AuditLogsTable logs={logs} pagination={pagination} />
    </div>
  );
}
