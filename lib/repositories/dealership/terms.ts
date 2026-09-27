// Dealership terms repository - the standing terms a dealership offers buyers
import { db } from "@/lib/prisma";
import type { DealershipTermsInput } from "@/lib/validations/schemas";

const TERMS_SELECT = {
  offersFinancing: true,
  financingNote: true,
  acceptsTradeIn: true,
  allowsInspection: true,
  offersDelivery: true,
} as const;

/** `organizationId` is server-sourced from ctx, never a client argument. */
export async function findDealershipTerms(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    select: TERMS_SELECT,
  });
}

export async function updateDealershipTerms(organizationId: string, data: DealershipTermsInput) {
  return db.organization.update({
    where: { id: organizationId },
    data,
    select: TERMS_SELECT,
  });
}
