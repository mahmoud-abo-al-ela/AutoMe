// Test drive booking - the one place a booking takes or moves to a slot
import type { Prisma, TestDriveStatus } from "@/lib/generated/prisma";
import { publicCarWhere } from "@/lib/repositories/car/visibility";
import { runInTransaction } from "@/lib/repositories/transaction";
import { serializeTestDrive } from "@/lib/utils/serializers";

/**
 * A slot is a range of time on one car's day, and bookings may span several
 * of the grid's slots; two bookings clash when their ranges overlap. Every
 * write that puts a booking on a day — a new request, an edit — runs here:
 * inside one transaction that first takes a lock on that car's day, then
 * re-reads what it decides on. Two requests for the same car and day so run
 * one after the other, and the second sees the first; the overlap check can
 * no longer pass for both (it could before: it ran outside any transaction).
 *
 * The lock is Postgres's transaction-scoped advisory lock: released at commit
 * or rollback, never held by a connection, so it is safe behind a transaction
 * pooler. It guards only what goes through bookSlot — which is why nothing
 * else may insert a booking or move one onto a day.
 */

/** Statuses that hold a slot; CANCELLED and COMPLETED free it. */
export const OCCUPYING_STATUSES: readonly TestDriveStatus[] = ["PENDING", "CONFIRMED"];

export interface SlotRange {
  startTime: string;
  endTime: string;
}

export interface SlotRequest extends SlotRange {
  carId: string;
  /** The calendar day at midnight UTC, as the column stores it. */
  date: Date;
  /** "YYYY-MM-DD", the day the lock is taken on. */
  day: string;
}

export interface SlotContext {
  /** The car as the public may book it; null when it is not (hidden, sold, unavailable). */
  car: { id: string; organizationId: string } | null;
  /** Ranges already held on that car's day, the booking being moved excluded. */
  booked: SlotRange[];
}

export type SlotWrite =
  | { kind: "create"; userId: string; notes: string }
  | { kind: "move"; testDriveId: string; notes: string };

/**
 * The decision the caller makes inside the lock: given the car and the day's
 * other bookings, either refuse (throw) or let the write happen.
 */
export type SlotCheck = (context: SlotContext) => void;

async function lockCarDay(tx: Prisma.TransactionClient, carId: string, day: string) {
  // hashtextextended gives the 64-bit key the lock takes; collisions between
  // car-days would only serialize two unrelated bookings, never wrong them.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${carId}:${day}`}, 0))::text AS "locked"`;
}

/**
 * Take, or move to, a slot on a car's day. Returns the booking — for a new
 * request by the same user for the same car and range that is already held,
 * the one already there: a repeated submission books once.
 */
export async function bookSlot(request: SlotRequest, write: SlotWrite, check: SlotCheck) {
  return runInTransaction(async (tx) => {
    await lockCarDay(tx, request.carId, request.day);

    if (write.kind === "create") {
      const same = await tx.testDrive.findFirst({
        where: {
          userId: write.userId,
          carId: request.carId,
          date: request.date,
          startTime: request.startTime,
          endTime: request.endTime,
          status: { in: [...OCCUPYING_STATUSES] },
        },
      });
      if (same) return serializeTestDrive(same);
    }

    const [car, booked] = await Promise.all([
      tx.car.findFirst({ where: { id: request.carId, ...publicCarWhere("listed") }, select: { id: true, organizationId: true } }),
      tx.testDrive.findMany({
        where: {
          carId: request.carId,
          date: request.date,
          status: { in: [...OCCUPYING_STATUSES] },
          ...(write.kind === "move" && { id: { not: write.testDriveId } }),
        },
        select: { startTime: true, endTime: true },
      }),
    ]);
    check({ car, booked });

    if (write.kind === "create") {
      return serializeTestDrive(
        await tx.testDrive.create({
          data: {
            date: request.date,
            startTime: request.startTime,
            endTime: request.endTime,
            notes: write.notes,
            status: "PENDING",
            userId: write.userId,
            carId: request.carId,
            organizationId: car!.organizationId,
          },
        })
      );
    }
    return serializeTestDrive(
      await tx.testDrive.update({
        where: { id: write.testDriveId },
        data: { date: request.date, startTime: request.startTime, endTime: request.endTime, notes: write.notes, status: "PENDING" },
        include: { car: { select: { make: true, model: true, year: true } } },
      })
    );
  });
}
