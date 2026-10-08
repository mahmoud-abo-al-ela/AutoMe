import * as detailRepo from "@/lib/repositories/super-admin/dealership-detail";
import type { Prisma } from "@/lib/generated/prisma";
import { getActivity } from "@/lib/services/audit/activity";
import { graceEndsOn } from "@/lib/services/billing/periods";
import { addDays, cairoDate, cairoMidnight } from "@/lib/utils/date-only";
import { DETAIL_CARS_PER_PAGE, type DealershipDetailQuery, type DetailCarSort } from "./dealerships-options";

/**
 * One dealership for the super-admin (canvas: Super admin dealership detail
 * round 1, "1 · Record with tabs", and dealership tabs round 1 — Cars A, Team
 * A, Billing C, Activity A): the record and its standing on every tab, then
 * only the open tab's rows.
 */

const RECENT_DAYS = 30;
const SUMMARY_CARS = 5;
const SUMMARY_ACTIVITY = 6;

const CAR_ORDER: Record<DetailCarSort, Prisma.CarOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  interest: [{ savedBy: { _count: "desc" } }, { buyerQuestions: { _count: "desc" } }, { createdAt: "desc" }],
  longest: [{ createdAt: "asc" }],
  price: [{ price: "desc" }],
};

const iso = (date: Date | null | undefined) => date?.toISOString() ?? null;

type CarRow = Awaited<ReturnType<typeof detailRepo.findCars>>[number];
function serializeCar(car: CarRow) {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    status: car.status,
    mileage: car.mileage,
    image: car.images[0] ?? null,
    createdAt: car.createdAt.toISOString(),
    saves: car._count.savedBy,
    questions: car._count.buyerQuestions,
    drives: car._count.testDrive,
  };
}

/** The Cars tab's search: words match the make or model; a four-digit number, the year. */
function carSearch(search: string): Prisma.CarWhereInput {
  if (!search) return {};
  const words = search.split(/\s+/).filter(Boolean).slice(0, 4);
  return {
    AND: words.map((word) =>
      /^\d{4}$/.test(word)
        ? { year: Number(word) }
        : { OR: [{ make: { contains: word, mode: "insensitive" as const } }, { model: { contains: word, mode: "insensitive" as const } }] },
    ),
  };
}

export async function getDealershipDetail(id: string, query: DealershipDetailQuery, now: Date = new Date()) {
  const org = await detailRepo.findDealership(id);
  if (!org) return null;

  const since = cairoMidnight(addDays(cairoDate(now), -(RECENT_DAYS - 1)));
  const [carsByStatus, paid, lastFailure] = await Promise.all([
    detailRepo.countCarsByStatus(id),
    detailRepo.sumPaidPayments(id),
    org.subscription?.status === "PAST_DUE" ? detailRepo.findLastFailedPayment(id) : null,
  ]);
  const carsTotal = Object.values(carsByStatus).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const sub = org.subscription;

  const base = {
    query,
    tab: query.tab,
    dealership: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      address: org.address,
      website: org.website,
      city: org.city,
      region: org.region,
      isActive: org.isActive,
      pendingOwnerEmail: org.pendingOwnerEmail,
      rating: org.totalReviews > 0 ? { value: org.averageRating, count: org.totalReviews } : null,
      createdAt: org.createdAt.toISOString(),
      owner: org.memberships[0]?.user ?? null,
    },
    subscription: sub
      ? {
          status: sub.status,
          billingPeriod: sub.billingPeriod,
          periodEnd: iso(sub.currentPeriodEnd),
          trialEndsAt: iso(sub.trialEndsAt ?? (sub.status === "TRIALING" ? sub.currentPeriodEnd : null)),
          pastDueSince: iso(sub.pastDueSince),
          // The day it drops to the free plan if nobody pays.
          dropsOn: sub.status === "PAST_DUE" && sub.currentPeriodEnd ? graceEndsOn(sub.currentPeriodEnd) : null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          plan: sub.plan,
        }
      : null,
    lastFailure: lastFailure ? { ...lastFailure, createdAt: lastFailure.createdAt.toISOString() } : null,
    counts: {
      cars: carsTotal,
      carsOnSale: carsByStatus.AVAILABLE ?? 0,
      carsHidden: carsByStatus.UNAVAILABLE ?? 0,
      carsSold: carsByStatus.SOLD ?? 0,
      team: org._count.memberships,
      paidCents: paid.cents,
      payments: paid.count,
    },
  };

  if (query.tab === "summary") {
    const [drives, questions, cars, activity, plans] = await Promise.all([
      detailRepo.countTestDrivesSince(id, since),
      detailRepo.countBuyerQuestionsSince(id, since),
      detailRepo.findCars({ where: { organizationId: id }, orderBy: CAR_ORDER.newest, skip: 0, take: SUMMARY_CARS }),
      getActivity({ organizationId: id, kind: "all", page: 1 }),
      detailRepo.findPlans(),
    ]);
    return {
      ...base,
      summary: {
        drives: {
          requested: Object.values(drives).reduce<number>((sum, n) => sum + (n ?? 0), 0),
          completed: drives.COMPLETED ?? 0,
        },
        questions,
        cars: cars.map(serializeCar),
        activity: { ...activity, entries: activity.entries.slice(0, SUMMARY_ACTIVITY) },
      },
      plans,
    };
  }

  if (query.tab === "cars") {
    const where: Prisma.CarWhereInput = {
      organizationId: id,
      ...(query.status !== "all" && { status: query.status }),
      ...carSearch(query.search),
    };
    const total = await detailRepo.countCars(where);
    const pages = Math.max(1, Math.ceil(total / DETAIL_CARS_PER_PAGE));
    const page = Math.min(query.page, pages);
    const cars = await detailRepo.findCars({
      where,
      orderBy: CAR_ORDER[query.sort],
      skip: (page - 1) * DETAIL_CARS_PER_PAGE,
      take: DETAIL_CARS_PER_PAGE,
    });
    return { ...base, cars: { rows: cars.map(serializeCar), total, page, pages } };
  }

  if (query.tab === "team") {
    const [team, carsAdded, recentChanges, plan] = await Promise.all([
      detailRepo.findTeam(id),
      detailRepo.countAuditByUser(id, { action: "CAR_CREATED" }),
      detailRepo.countAuditByUser(id, { createdAt: { gte: since } }),
      sub ? Promise.resolve(sub.plan) : detailRepo.findPlans().then((plans) => plans.find((p) => p.type === "STARTER") ?? null),
    ]);
    return {
      ...base,
      team: team.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
        // Invited and not signed in since: checkUser stamps acceptedAt on their first sign-in.
        pending: Boolean(m.invitedAt && !m.acceptedAt),
        user: m.user,
        carsAdded: carsAdded.get(m.user.id) ?? 0,
        recentChanges: recentChanges.get(m.user.id) ?? 0,
      })),
      seats: plan ? plan.maxMembers : null,
    };
  }

  if (query.tab === "billing") {
    const [payments, plans] = await Promise.all([detailRepo.findPayments(id), detailRepo.findPlans()]);
    return {
      ...base,
      payments: payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), paidAt: iso(p.paidAt) })),
      plans,
    };
  }

  const activity = await getActivity({
    organizationId: id,
    kind: query.kind,
    // Entries are scoped to this dealership, so an id from anywhere else matches nothing.
    userId: query.who || undefined,
    days: query.days === "all" ? undefined : Number(query.days),
    page: query.page,
  });
  return { ...base, activity };
}

export type DealershipDetail = NonNullable<Awaited<ReturnType<typeof getDealershipDetail>>>;

/** The plans an admin can put a dealership on, cheapest first. */
export function getActivePlans() {
  return detailRepo.findPlans();
}
