import { db } from "@/lib/prisma";
import PlansHeader from "./_components/PlansHeader";
import PlansGrid from "./_components/PlansGrid";
import SubscriptionStats from "./_components/SubscriptionStats";

async function getPlansData() {
  const [plans, subscriptionStats] = await Promise.all([
    db.plan.findMany({
      orderBy: { monthlyPrice: "asc" },
      include: {
        _count: {
          select: { subscriptions: true },
        },
        subscriptions: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    }),
    db.subscription.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const mrr = await db.subscription.findMany({
    where: { status: "ACTIVE" },
    include: { plan: true },
  });

  const monthlyRecurringRevenue = mrr.reduce(
    (sum, sub) => sum + (sub.plan?.monthlyPrice || 0),
    0
  );

  return {
    plans: plans.map((p) => ({
      ...p,
      activeSubscriptions: p.subscriptions.length,
    })),
    subscriptionStats: subscriptionStats.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {}),
    mrr: monthlyRecurringRevenue,
  };
}

export default async function PlansPage() {
  const { plans, subscriptionStats, mrr } = await getPlansData();

  return (
    <div className="space-y-6">
      <PlansHeader />
      <SubscriptionStats stats={subscriptionStats} mrr={mrr} />
      <PlansGrid plans={plans} />
    </div>
  );
}
