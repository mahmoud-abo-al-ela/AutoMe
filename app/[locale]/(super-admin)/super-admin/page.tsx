import { db } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils/datetime";
import PlatformStats from "./_components/PlatformStats";
import RecentOrganizations from "./_components/RecentOrganizations";
import PlatformOverviewChart from "./_components/PlatformOverviewChart";
import ActiveImpersonations from "./_components/ActiveImpersonations";

async function getPlatformStats() {
  const [
    totalOrganizations,
    activeOrganizations,
    totalUsers,
    totalCars,
    totalTestDrives,
    subscriptionsByPlan,
    recentOrganizations,
    monthlyGrowth,
  ] = await Promise.all([
    // Total organizations
    db.organization.count(),
    // Active organizations
    db.organization.count({ where: { isActive: true } }),
    // Total users
    db.user.count(),
    // Total cars
    db.car.count(),
    // Total test drives
    db.testDrive.count(),
    // Subscriptions by plan type
    db.subscription.groupBy({
      by: ["planId"],
      _count: { id: true },
      where: { status: "ACTIVE" },
    }),
    // Recent organizations
    db.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { cars: true, memberships: true },
        },
      },
    }),
    // Monthly growth (last 6 months)
    getMonthlyGrowth(),
  ]);

  // Get plan details for subscription breakdown
  const plans = await db.plan.findMany();
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

  const subscriptionBreakdown = subscriptionsByPlan.map((s) => ({
    plan: planMap[s.planId]?.name || "Unknown",
    count: s._count.id,
  }));

  return {
    totalOrganizations,
    activeOrganizations,
    totalUsers,
    totalCars,
    totalTestDrives,
    subscriptionBreakdown,
    recentOrganizations,
    monthlyGrowth,
  };
}

async function getMonthlyGrowth() {
  const locale = (await getLocale()) as Locale;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const organizations = await db.organization.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const users = await db.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const cars = await db.car.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  // Group by month
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthName = formatDate(date, locale, { month: "short", day: undefined, year: undefined });

    months.push({
      month: monthName,
      organizations: organizations.filter(
        (o) =>
          `${o.createdAt.getFullYear()}-${String(
            o.createdAt.getMonth() + 1
          ).padStart(2, "0")}` === monthKey
      ).length,
      users: users.filter(
        (u) =>
          `${u.createdAt.getFullYear()}-${String(
            u.createdAt.getMonth() + 1
          ).padStart(2, "0")}` === monthKey
      ).length,
      cars: cars.filter(
        (c) =>
          `${c.createdAt.getFullYear()}-${String(
            c.createdAt.getMonth() + 1
          ).padStart(2, "0")}` === monthKey
      ).length,
    });
  }

  return months;
}

export default async function SuperAdminDashboard() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground">
          Monitor and manage the AutoMe SaaS platform
        </p>
      </div>

      {/* Stats Cards */}
      <PlatformStats
        totalOrganizations={stats.totalOrganizations}
        activeOrganizations={stats.activeOrganizations}
        totalUsers={stats.totalUsers}
        totalCars={stats.totalCars}
        totalTestDrives={stats.totalTestDrives}
        subscriptionBreakdown={stats.subscriptionBreakdown}
      />

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <PlatformOverviewChart data={stats.monthlyGrowth} />

        {/* Active Impersonations */}
        <ActiveImpersonations />
      </div>

      {/* Recent Organizations */}
      <RecentOrganizations organizations={stats.recentOrganizations} />
    </div>
  );
}
