import { db } from "@/lib/prisma";

/**
 * A booking with everything its "new booking" emails need: the car, the
 * buyer, and the dealership with its members (the owner is a fallback
 * address when the dealership has none of its own).
 */
export async function findTestDriveForRequestEmails(testDriveId: string) {
  return db.testDrive.findUnique({
    where: { id: testDriveId },
    include: {
      car: true,
      user: true,
      organization: {
        include: { memberships: { include: { user: true } } },
      },
    },
  });
}

/** A booking with the car, buyer and dealership its status email names. */
export async function findTestDriveForStatusEmail(testDriveId: string) {
  return db.testDrive.findUnique({
    where: { id: testDriveId },
    include: { car: true, user: true, organization: true },
  });
}
