// Test drive mutation functions. A booking is created or moved to a slot only
// by bookSlot (./booking.ts), under the car-day lock; nothing here may do either.
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * Compare-and-set: returns null, writing nothing, if the status changed since the caller checked.
 * @param {string} id
 * @param {string} organizationId
 * @param {string[]} fromStatuses
 * @param {{ status: string }} updateData
 */
export async function transitionTestDrive(id, organizationId, fromStatuses, updateData) {
  const { count } = await db.testDrive.updateMany({
    where: { id, organizationId, status: { in: fromStatuses } },
    data: updateData,
  });
  if (count === 0) return null;

  const testDrive = await db.testDrive.findUnique({
    where: { id },
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
