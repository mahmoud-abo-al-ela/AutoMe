// Buyer question repository - Data access layer for queries
import { db } from "@/lib/prisma";
import type { BuyerQuestionStatus } from "@/lib/generated/prisma";

/** At most this many dealer answers reach the model per question. */
export const MAX_DEALER_ANSWERS = 20;

/**
 * The dealer's answers that apply to one car: those given on it, and those
 * the dealer marked as true of every car they sell. Most-asked first, so the
 * cap drops the long tail rather than the questions buyers actually ask.
 */
export async function findAnswersForCar(carId: string, organizationId: string) {
  return db.buyerQuestion.findMany({
    where: {
      organizationId,
      status: "ANSWERED",
      OR: [{ carId }, { appliesToAllCars: true }],
    },
    select: { question: true, answer: true, appliesToAllCars: true },
    orderBy: [{ askCount: "desc" }, { answeredAt: "desc" }],
    take: MAX_DEALER_ANSWERS,
  });
}

/** One page of a dealership's questions in one status, most-asked first. */
export async function findBuyerQuestions(
  organizationId: string,
  status: BuyerQuestionStatus,
  page: number,
  limit: number
) {
  const where = { organizationId, status };
  const [questions, total] = await Promise.all([
    db.buyerQuestion.findMany({
      where,
      select: {
        id: true,
        question: true,
        locale: true,
        askCount: true,
        lastAskedAt: true,
        status: true,
        answer: true,
        appliesToAllCars: true,
        answeredAt: true,
        car: {
          select: { id: true, make: true, model: true, year: true, title: true, titleEn: true, titleAr: true },
        },
      },
      orderBy: [{ askCount: "desc" }, { lastAskedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.buyerQuestion.count({ where }),
  ]);
  return { questions, total };
}

/** How many questions a dealership has in each status. */
export async function countBuyerQuestionsByStatus(organizationId: string) {
  const grouped = await db.buyerQuestion.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: { _all: true },
  });
  const counts: Record<BuyerQuestionStatus, number> = { OPEN: 0, ANSWERED: 0, DISMISSED: 0 };
  for (const row of grouped) counts[row.status] = row._count._all;
  return counts;
}
