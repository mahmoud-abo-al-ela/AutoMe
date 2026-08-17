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
import type {
  AuditLogFilters,
  AuditLogsPageInfo,
  AuditLogWithUser,
} from "./_lib/audit-types";

type SearchParams = Record<string, string | string[] | undefined>;

/** Repeated query keys arrive as arrays; the filters only ever set one value. */
function readParam(params: SearchParams, key: string): string {
  const value = params?.[key];
  return (Array.isArray(value) ? value[0] : value) || "";
}

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const user = await checkUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  // The org layout redirects to /sign-in when there is no user, so this page
  // is only reachable with one.
  const membership = await getUserMembership(user!.id, organization.id);
  const isOwner = membership?.role === "OWNER";

  if (!isOwner) {
    notFound();
  }

  // Parse search params
  const page = parseInt(readParam(search, "page"), 10) || 1;
  const action = readParam(search, "action");
  const entityType = readParam(search, "entityType");
  const userId = readParam(search, "userId");
  const startDate = readParam(search, "startDate");
  const endDate = readParam(search, "endDate");

  // Build filters
  const filters: AuditLogFilters = {};
  if (action) filters.action = action;
  if (entityType) filters.entityType = entityType;
  if (userId) filters.userId = userId;
  // The date picker writes startDate/endDate to the URL and the query builder
  // honours them, but this page never read them back, so the range filter did
  // nothing and the picker reset itself on every reload.
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  // Get audit logs
  const { logs, pagination } = (await getAuditLogs({
    organizationId: organization.id,
    filters,
    pagination: {
      page,
      limit: 10,
    },
  })) as { logs: AuditLogWithUser[]; pagination: AuditLogsPageInfo };

  return (
    <div className="space-y-6">
      <AuditLogsHeader retentionInfo={organization.subscription?.plan} />

      <AuditLogsFilters
        currentFilters={{ action, entityType, userId, startDate, endDate }}
      />

      <AuditLogsTable logs={logs} pagination={pagination} />
    </div>
  );
}
