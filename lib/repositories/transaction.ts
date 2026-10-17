import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export function runInTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return db.$transaction(work, options);
}
