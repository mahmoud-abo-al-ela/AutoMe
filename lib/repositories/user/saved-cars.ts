// Saved cars - idempotent writes, for callers that may repeat a request
import { db } from "@/lib/prisma";

export async function saveCarOnce(userId: string, carId: string): Promise<boolean> {
  const { count } = await db.savedCar.createMany({ data: [{ userId, carId }], skipDuplicates: true });
  return count === 1;
}

/** Remove a saved car; true if this call removed it, false if it was not saved. */
export async function unsaveCarOnce(userId: string, carId: string): Promise<boolean> {
  const { count } = await db.savedCar.deleteMany({ where: { userId, carId } });
  return count === 1;
}
