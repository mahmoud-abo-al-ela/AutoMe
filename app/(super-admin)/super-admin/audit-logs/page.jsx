import { Suspense } from "react";
import { db } from "@/lib/prisma";
import AuditLogsHeader from "./_components/AuditLogsHeader";
import AuditLogsTable from "./_components/AuditLogsTable";
import { Skeleton } from "@/components/ui/skeleton";

async function getAuditLogs(searchParams) {
  const page = parseInt(searchParams?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  const action = searchParams?.action || "all";
  const entity = searchParams?.entity || "all";
  const search = searchParams?.search || "";

  const where = {
    ...(action !== "all" && { action }),
    ...(entity !== "all" && { entityType: entity }),
    ...(search && {
      OR: [
        { userEmail: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { organizationId: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [logs, total, actionStats, entityStats] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({
      by: ["action"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.auditLog.groupBy({
      by: ["entityType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    actions: actionStats.map((a) => a.action),
    entities: entityStats.map((e) => e.entityType),
  };
}

export default async function AuditLogsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const { logs, pagination, actions, entities } = await getAuditLogs(resolvedParams);

  return (
    <div className="space-y-6">
      <AuditLogsHeader actions={actions} entities={entities} />
      
      <Suspense fallback={<TableSkeleton />}>
        <AuditLogsTable logs={logs} pagination={pagination} />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
