// Dealership repository - the dealer's own words (description, address) in both languages
import { db } from "@/lib/prisma";
import type { DealershipTextField } from "@/lib/utils/dealership-text";

const PROFILE_TEXT_SELECT = {
  description: true,
  descriptionEn: true,
  descriptionAr: true,
  address: true,
  addressEn: true,
  addressAr: true,
} as const;

/** `organizationId` is server-sourced (ctx or the dealership's own row), never client input. */
export async function findDealershipProfileText(organizationId: string) {
  return db.organization.findUnique({ where: { id: organizationId }, select: PROFILE_TEXT_SELECT });
}

/**
 * Store translated pairs, but only if each translated field still holds the
 * text that was translated (`translatedFrom`, as stored): a dealer who saved
 * again while the translation ran must not have their new text paired with
 * the old one's translation. Returns whether the row was written.
 */
export async function saveDealershipProfileLanguages(
  organizationId: string,
  translatedFrom: Partial<Record<DealershipTextField, string>>,
  data: Partial<Record<"descriptionEn" | "descriptionAr" | "addressEn" | "addressAr", string>>
) {
  const { count } = await db.organization.updateMany({
    where: { id: organizationId, ...translatedFrom },
    data,
  });
  return count > 0;
}
