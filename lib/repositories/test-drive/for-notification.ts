import { db } from "@/lib/prisma";

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
