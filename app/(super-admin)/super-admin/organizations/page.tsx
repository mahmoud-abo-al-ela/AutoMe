import { Suspense } from "react";
import { db } from "@/lib/prisma";
import { Prisma, type PlanType } from "@/lib/generated/prisma";
import OrganizationsTable from "./_components/OrganizationsTable";
import OrganizationsHeader from "./_components/OrganizationsHeader";
import { Skeleton } from "@/components/ui/skeleton";

/** The filter and pagination params this page reads. */
type OrganizationsSearchParams = {
  page?: string;
  search?: string;
  status?: string;
  plan?: string;
};

async function getOrganizations(searchParams: OrganizationsSearchParams) {
  const page = parseInt(searchParams?.page ?? "") || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = searchParams?.search || "";
  const status = searchParams?.status || "all";
  const plan = searchParams?.plan || "all";

  // Annotated so the "insensitive" literals narrow to Prisma's QueryMode. As
  // in the other list pages, `plan` arrives raw from the query string and is
  // not validated against PlanType before Prisma sees it.
  const where: Prisma.OrganizationWhereInput = {
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
        plan: { type: plan as PlanType },
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

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<OrganizationsSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { organizations, pagination, plans } = await getOrganizations(
    resolvedParams
  );

  return (
    <div className="space-y-6">
      <OrganizationsHeader plans={plans} />

      <Suspense fallback={<TableSkeleton />}>
        {/* OrganizationsTable never destructured a `plans` prop, so the one
            passed here was silently ignored; dropped rather than typed. */}
        <OrganizationsTable
          organizations={organizations}
          pagination={pagination}
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
