import { Suspense } from "react";
import { db } from "@/lib/prisma";
import { Prisma, type AuditAction, type EntityType } from "@/lib/generated/prisma";
import AuditLogsHeader from "./_components/AuditLogsHeader";
import AuditLogsTable from "./_components/AuditLogsTable";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The filter and pagination params this page reads. Single strings rather than
 * Next's string | string[]: every link that sets these sets one value, and the
 * reads below have never handled the repeated-key case.
 */
type AuditLogsSearchParams = {
  page?: string;
  action?: string;
  entity?: string;
  search?: string;
};

async function getAuditLogs(searchParams: AuditLogsSearchParams) {
  const page = parseInt(searchParams?.page ?? "") || 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  const action = searchParams?.action || "all";
  const entity = searchParams?.entity || "all";
  const search = searchParams?.search || "";

  // Annotated so the `mode: "insensitive"` literals narrow to Prisma's
  // QueryMode enum rather than widening to string.
  const where: Prisma.AuditLogWhereInput = {
    // action and entityType are Prisma enums, but these values arrive raw from
    // the query string and are never validated against AuditAction/EntityType.
    // Casting preserves the existing behaviour, in which an unknown value is
    // simply passed to Prisma and rejected there.
    ...(action !== "all" && { action: action as AuditAction }),
    ...(entity !== "all" && { entityType: entity as EntityType }),
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

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogsSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { logs, pagination, actions, entities } = await getAuditLogs(
    resolvedParams
  );

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
