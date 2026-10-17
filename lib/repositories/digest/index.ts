import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export async function findDigestOrganizations() {
  return db.organization.findMany({
    where: { isActive: true, deletedAt: null, weeklyDigestEnabled: true },
    select: {
      id: true,
      name: true,
      slug: true,
      emailLocale: true,
      memberships: {
        where: { role: "OWNER", user: { email: { not: null } } },
        select: { user: { select: { email: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type DigestOrganization = Awaited<ReturnType<typeof findDigestOrganizations>>[number];

export async function countWeeklyActivity(organizationId: string, start: Date, end: Date) {
  const inWeek = { gte: start, lt: end };
  const [
    carsListed,
    carsAvailable,
    testDriveRequests,
    testDrivesPending,
    assistantAnswers,
    answersHelpful,
    answersUnhelpful,
    questionsNew,
    questionsOpen,
  ] = await Promise.all([
    db.car.count({ where: { organizationId, createdAt: inWeek } }),
    db.car.count({ where: { organizationId, status: "AVAILABLE" } }),
    db.testDrive.count({ where: { organizationId, createdAt: inWeek } }),
    db.testDrive.count({ where: { organizationId, status: "PENDING" } }),
    // Answers only: declines and off-topic replies are kept too, for the quality report.
    db.assistantAnswer.count({ where: { organizationId, createdAt: inWeek, outcome: "ANSWERED" } }),
    db.assistantAnswer.count({ where: { organizationId, createdAt: inWeek, helpful: true } }),
    db.assistantAnswer.count({ where: { organizationId, createdAt: inWeek, helpful: false } }),
    db.buyerQuestion.count({ where: { organizationId, createdAt: inWeek } }),
    db.buyerQuestion.count({ where: { organizationId, status: "OPEN" } }),
  ]);
  return {
    carsListed,
    carsAvailable,
    testDriveRequests,
    testDrivesPending,
    assistantAnswers,
    answersHelpful,
    answersUnhelpful,
    questionsNew,
    questionsOpen,
  };
}

export type WeeklyActivity = Awaited<ReturnType<typeof countWeeklyActivity>>;

export async function claimDigestSend(organizationId: string, weekStart: Date): Promise<boolean> {
  try {
    await db.digestSend.create({ data: { organizationId, weekStart } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

export async function markDigestSent(organizationId: string, weekStart: Date, recipients: number) {
  await db.digestSend.update({
    where: { organizationId_weekStart: { organizationId, weekStart } },
    data: { recipients },
  });
}

/** Give the week back when nothing could be sent, so the next run retries it. */
export async function releaseDigestSend(organizationId: string, weekStart: Date) {
  await db.digestSend.deleteMany({ where: { organizationId, weekStart } });
}
