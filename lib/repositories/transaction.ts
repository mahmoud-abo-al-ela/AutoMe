import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Run `work` in one database transaction.
 *
 * Services decide what belongs together — claim a payment, extend a
 * subscription, record the period — so they open the transaction; the
 * repositories they call inside it take the `tx` they are handed. This is the
 * one place outside a repository function that a transaction starts, so the
 * services never hold the Prisma client.
 */
export function runInTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return db.$transaction(work, options);
}
