// Working hours repository functions
import { db } from "@/lib/prisma";

/**
 * Update working hours
 */
export async function updateWorkingHours(dealershipId, workingHours) {
  // Delete existing working hours
  await db.workingHours.deleteMany({
    where: { dealershipId },
  });

  // Create new working hours
  const promises = workingHours.map((hour) =>
    db.workingHours.create({
      data: {
        dayOfWeek: Array.isArray(hour.dayOfWeek)
          ? hour.dayOfWeek
          : [hour.dayOfWeek],
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isOpen: hour.isOpen,
        dealershipId,
      },
    })
  );

  await Promise.all(promises);
}
