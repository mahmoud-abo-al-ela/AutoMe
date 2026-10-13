// Saved cars - idempotent writes, for callers that may repeat a request
import { db } from "@/lib/prisma";

/**
 * Save a car for a user; true if this call saved it, false if it was saved
 * already. One statement on the (userId, carId) unique key, so two calls at
 * once save it once and neither fails — unlike create, which throws on the
 * second. An MCP client retrying a request is the case this is for.
 */
export async function saveCarOnce(userId: string, carId: string): Promise<boolean> {
  const { count } = await db.savedCar.createMany({ data: [{ userId, carId }], skipDuplicates: true });
  return count === 1;
}

/** Remove a saved car; true if this call removed it, false if it was not saved. */
export async function unsaveCarOnce(userId: string, carId: string): Promise<boolean> {
  const { count } = await db.savedCar.deleteMany({ where: { userId, carId } });
  return count === 1;
}
