// Test drive mutation functions
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * Create a test drive
 */
export async function createTestDrive(testDriveData) {
  const testDrive = await db.testDrive.create({
    data: testDriveData,
  });

  return serializeTestDrive(testDrive);
}

/**
 * Update test drive
 */
export async function updateTestDrive(id, updateData) {
  const testDrive = await db.testDrive.update({
    where: { id },
    data: updateData,
    include: {
      car: {
        select: {
          make: true,
          model: true,
          year: true,
        },
      },
    },
  });

  return serializeTestDrive(testDrive);
}
