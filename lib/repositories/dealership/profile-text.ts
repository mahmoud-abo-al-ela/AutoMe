// Dealership repository - the dealer's own words (description, address, financing note) in both languages
import { db } from "@/lib/prisma";
import type { DealershipTextField } from "@/lib/utils/dealership-text";

const PROFILE_TEXT_SELECT = {
  description: true,
  descriptionEn: true,
  descriptionAr: true,
  address: true,
  addressEn: true,
  addressAr: true,
  financingNote: true,
  financingNoteEn: true,
  financingNoteAr: true,
} as const;

/** `organizationId` is server-sourced (ctx or the dealership's own row), never client input. */
export async function findDealershipProfileText(organizationId: string) {
  return db.organization.findUnique({ where: { id: organizationId }, select: PROFILE_TEXT_SELECT });
}

// Writes only if each field still holds the translated text, so a newer save is never paired with a stale translation.
export async function saveDealershipProfileLanguages(
  organizationId: string,
  translatedFrom: Partial<Record<DealershipTextField, string>>,
  data: Partial<Record<`${DealershipTextField}${"En" | "Ar"}`, string>>
) {
  const { count } = await db.organization.updateMany({
    where: { id: organizationId, ...translatedFrom },
    data,
  });
  return count > 0;
}
