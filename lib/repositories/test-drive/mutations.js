// Test drive mutation functions. A booking is created or moved to a slot only
// by bookSlot (./booking.ts), under the car-day lock; nothing here may do either.
import { db } from "@/lib/prisma";
import { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * Move a test drive from one of `fromStatuses` to a new status — a
 * compare-and-set. The status the caller validated the move against must
 * still be the booking's; if it changed meanwhile (the buyer cancelled while
 * the dealer was confirming), nothing is written and this returns null.
 * Scoped by organization in the WHERE as well.
 *
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
