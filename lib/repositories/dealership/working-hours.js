// Working hours repository functions
import { db } from "@/lib/prisma";

/**
 * Get working hours for an organization
 */
export async function findWorkingHours(organizationId) {
  const workingHours = await db.workingHours.findMany({
    where: { organizationId },
    orderBy: { dayOfWeek: "asc" },
  });

  return workingHours;
}

/**
 * Update working hours for an organization
 */
export async function updateWorkingHours(organizationId, workingHours) {
  // Validate input
  if (!Array.isArray(workingHours) || workingHours.length === 0) {
    throw new Error("Working hours must be a non-empty array");
  }

  // Delete existing working hours for this organization
  await db.workingHours.deleteMany({
    where: { organizationId },
  });

  // Create new working hours with validation
  const promises = workingHours.map((hour) => {
    // Ensure dayOfWeek is an array and not empty
    const dayOfWeek = Array.isArray(hour.dayOfWeek)
      ? hour.dayOfWeek.filter(d => d) // Remove any undefined/null values
      : [hour.dayOfWeek].filter(d => d);

    if (dayOfWeek.length === 0) {
      throw new Error("dayOfWeek cannot be empty");
    }

    return db.workingHours.create({
      data: {
        dayOfWeek,
        openTime: hour.openTime || "09:00",
        closeTime: hour.closeTime || "18:00",
        isOpen: hour.isOpen ?? false,
        organizationId,
      },
    });
  });

  await Promise.all(promises);
}
