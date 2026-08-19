import { db } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils/datetime";
import AnalyticsHeader from "./_components/AnalyticsHeader";
import AnalyticsCharts from "./_components/AnalyticsCharts";
import TopOrganizations from "./_components/TopOrganizations";
import GrowthMetrics from "./_components/GrowthMetrics";

async function getAnalyticsData() {
  // Resolved once rather than inside the per-month map, which would re-enter
  // next-intl's request context six times to get the same answer.
  const locale = (await getLocale()) as Locale;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // Get monthly data for the last 6 months
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);

      const [orgs, users, cars, testDrives] = await Promise.all([
        db.organization.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        db.user.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        db.car.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
        db.testDrive.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
          },
        }),
      ]);

      return {
        month: formatDate(monthStart, locale, { month: "short", day: undefined, year: undefined }),
        organizations: orgs,
        users,
        cars,
        testDrives,
      };
    })
  );

  // Get top organizations by cars
  const topByListings = await db.organization.findMany({
    take: 5,
    orderBy: { cars: { _count: "desc" } },
    include: {
      _count: { select: { cars: true, testDrives: true } },
      subscription: { include: { plan: true } },
    },
  });

  // Get top organizations by test drives
  const topByTestDrives = await db.organization.findMany({
    take: 5,
    orderBy: { testDrives: { _count: "desc" } },
    include: {
      _count: { select: { cars: true, testDrives: true } },
      subscription: { include: { plan: true } },
    },
  });

  // Growth metrics
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    thisMonthOrgs,
    lastMonthOrgs,
    thisMonthUsers,
    lastMonthUsers,
    thisMonthCars,
    lastMonthCars,
  ] = await Promise.all([
    db.organization.count({ where: { createdAt: { gte: thisMonth } } }),
    db.organization.count({
      where: { createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    db.user.count({ where: { createdAt: { gte: thisMonth } } }),
    db.user.count({
      where: { createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    db.car.count({ where: { createdAt: { gte: thisMonth } } }),
    db.car.count({
      where: { createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
  ]);

  return {
    monthlyData,
    topByListings,
    topByTestDrives,
    growth: {
      organizations: {
        current: thisMonthOrgs,
        previous: lastMonthOrgs,
        change: lastMonthOrgs
          ? ((thisMonthOrgs - lastMonthOrgs) / lastMonthOrgs) * 100
          : 0,
      },
      users: {
        current: thisMonthUsers,
        previous: lastMonthUsers,
        change: lastMonthUsers
          ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
          : 0,
      },
      cars: {
        current: thisMonthCars,
        previous: lastMonthCars,
        change: lastMonthCars
          ? ((thisMonthCars - lastMonthCars) / lastMonthCars) * 100
          : 0,
      },
    },
  };
}

export default async function AnalyticsPage() {
  const { monthlyData, topByListings, topByTestDrives, growth } =
    await getAnalyticsData();

  return (
    <div className="space-y-6">
      <AnalyticsHeader />
      <GrowthMetrics growth={growth} />
      <AnalyticsCharts monthlyData={monthlyData} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TopOrganizations
          title="Top by Listings"
          organizations={topByListings}
          metric="cars"
        />
        <TopOrganizations
          title="Top by Test Drives"
          organizations={topByTestDrives}
          metric="testDrives"
        />
      </div>
    </div>
  );
}
