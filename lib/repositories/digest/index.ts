import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Dealerships that get a weekly summary: active, not deleted, not opted out —
 * with their owners' addresses (owners only: owner's choice). A suspended or
 * deleted dealership never gets one.
 */
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

/**
 * The week's numbers for one dealership, straight from the database — the
 * model only ever writes words around these. `start` inclusive, `end`
 * exclusive. "Now" figures (available cars, pending test drives, open
 * questions) are as of the moment of sending.
 */
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
    db.assistantAnswer.count({ where: { organizationId, createdAt: inWeek } }),
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

/**
 * Claim this dealership's summary for the week, before anything is sent.
 * False when it is already claimed — by an earlier run, or a concurrent one;
 * the unique (organizationId, weekStart) pair decides, not a read-then-write.
 */
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
