import { Suspense } from "react";
import { db } from "@/lib/prisma";
import OrganizationsTable from "./_components/OrganizationsTable";
import OrganizationsHeader from "./_components/OrganizationsHeader";
import { Skeleton } from "@/components/ui/skeleton";

async function getOrganizations(searchParams) {
  const page = parseInt(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = searchParams?.search || "";
  const status = searchParams?.status || "all";
  const plan = searchParams?.plan || "all";

  const where = {
    // Exclude soft-deleted organizations
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status !== "all" && { isActive: status === "active" }),
    ...(plan !== "all" && {
      subscription: {
        plan: { type: plan },
      },
    }),
  };

  const [organizations, total, plans] = await Promise.all([
    db.organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { cars: true, memberships: true, testDrives: true },
        },
      },
    }),
    db.organization.count({ where }),
    db.plan.findMany({ orderBy: { monthlyPrice: "asc" } }),
  ]);

  return {
    organizations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    plans,
  };
}

export default async function OrganizationsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const { organizations, pagination, plans } = await getOrganizations(resolvedParams);

  return (
    <div className="space-y-6">
      <OrganizationsHeader plans={plans} />
      
      <Suspense fallback={<TableSkeleton />}>
        <OrganizationsTable
          organizations={organizations}
          pagination={pagination}
          plans={plans}
        />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
