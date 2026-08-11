import { Suspense } from "react";
import { db } from "@/lib/prisma";
import { Prisma, type UserRole } from "@/lib/generated/prisma";
import UsersTable from "./_components/UsersTable";
import UsersHeader from "./_components/UsersHeader";
import { Skeleton } from "@/components/ui/skeleton";

/** The filter and pagination params this page reads. */
type UsersSearchParams = {
  page?: string;
  search?: string;
  role?: string;
};

async function getUsers(searchParams: UsersSearchParams) {
  const page = parseInt(searchParams?.page ?? "") || 1;
  const limit = 15;
  const skip = (page - 1) * limit;
  const search = searchParams?.search || "";
  const role = searchParams?.role || "all";

  // Annotated so the "insensitive" literals narrow to Prisma's QueryMode. The
  // role cast mirrors audit-logs: it arrives raw from the query string and is
  // not validated against UserRole before Prisma sees it.
  const where: Prisma.UserWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role !== "all" && { role: role as UserRole }),
  };

  const [users, total, roleStats] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            savedCars: true,
            testDrives: true,
          },
        },
      },
    }),
    db.user.count({ where }),
    db.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    roleStats: roleStats.reduce<Record<string, number>>((acc, r) => {
      acc[r.role] = r._count.id;
      return acc;
    }, {}),
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { users, pagination, roleStats } = await getUsers(resolvedParams);

  return (
    <div className="space-y-6">
      <UsersHeader roleStats={roleStats} />

      <Suspense fallback={<TableSkeleton />}>
        <UsersTable users={users} pagination={pagination} />
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
