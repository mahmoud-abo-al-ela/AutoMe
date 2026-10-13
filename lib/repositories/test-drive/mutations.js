// Test drive mutation functions. A booking is created or moved to a slot only
// by bookSlot (./booking.ts), under the car-day lock; nothing here may do either.
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";

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
