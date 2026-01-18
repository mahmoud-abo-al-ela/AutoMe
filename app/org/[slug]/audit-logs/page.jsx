import { checkUser } from "@/lib/checkUser";
import {
  getOrganizationBySlug,
  getUserMembership,
} from "@/lib/getOrganization";
import { notFound } from "next/navigation";
import { getAuditLogs } from "@/lib/services/audit/audit";
import AuditLogsHeader from "./_components/AuditLogsHeader";
import AuditLogsTable from "./_components/AuditLogsTable";
import AuditLogsFilters from "./_components/AuditLogsFilters";

export default async function AuditLogsPage({ params, searchParams }) {
  const { slug } = await params;
  const search = await searchParams;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  const membership = await getUserMembership(user.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  if (!isOwner) {
    notFound();
  }

  // Parse search params
  const page = parseInt(search?.page) || 1;
  const action = search?.action || "";
  const entityType = search?.entityType || "";
  const userId = search?.userId || "";

  // Build filters
  const filters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (userId) filters.userId = userId;

  // Get audit logs
  const { logs, pagination } = await getAuditLogs({
    organizationId: organization.id,
    filters,
    pagination: {
      page,
      limit: 10,
    },
  });

  return (
    <div className="space-y-6">
      <AuditLogsHeader retentionInfo={organization.subscription?.plan} />

      <AuditLogsFilters currentFilters={{ action, entityType, userId }} />

      <AuditLogsTable logs={logs} pagination={pagination} />
    </div>
  );
}
