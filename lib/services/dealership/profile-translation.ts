// Dealership service - keeping the dealer's own words in both languages
import type { AiCallerContext } from "@/lib/ai/client";
import type { Locale } from "@/i18n/routing";
import * as dealershipRepo from "@/lib/repositories/dealership";
import { translateDealershipProfile, type DealershipProfileText } from "@/lib/services/ai/translateDealershipProfile";
import { dealershipTranslationPlan, languageColumn, type DealershipTextField } from "@/lib/utils/dealership-text";
import { logError } from "@/lib/utils/errors";
import { getRedis } from "@/lib/redis";

export async function syncDealershipProfileText(organizationId: string, caller: AiCallerContext): Promise<void> {
  let org: Awaited<ReturnType<typeof dealershipRepo.findDealershipProfileText>>;
  try {
    org = await dealershipRepo.findDealershipProfileText(organizationId);
  } catch (error) {
    logError("Dealership profile translation skipped", error);
    return;
  }
  if (!org) return;
  const plan = dealershipTranslationPlan(org);

  for (const from of ["en", "ar"] as const satisfies readonly Locale[]) {
    const items = plan.filter((item) => item.from === from);
    if (items.length === 0) continue;

    try {
      const text: DealershipProfileText = { description: "", address: "", financingNote: "" };
      for (const item of items) text[item.field] = item.source;
      const translated = await translateDealershipProfile(text, from, caller);

      const data: Record<string, string> = {};
      const translatedFrom: Partial<Record<DealershipTextField, string>> = {};
      for (const item of items) {
        if (!translated[item.field]) continue; // an empty reply is no translation
        data[languageColumn(item.field, item.from)] = item.source;
        data[languageColumn(item.field, item.to)] = translated[item.field];
        // The column as stored (untrimmed), so the guard matches it.
        translatedFrom[item.field] = org[item.field]!;
      }
      if (Object.keys(data).length > 0) {
        await dealershipRepo.saveDealershipProfileLanguages(organizationId, translatedFrom, data);
      }
    } catch (error) {
      logError(`Dealership profile translation (${from}) skipped`, error);
    }
  }
}

/** How long one storefront visit's claim on a dealership's translation holds. */
const STOREFRONT_CLAIM_SECONDS = 10 * 60;

/** Claims held in this instance, for when Redis is not configured (local, CI). */
const localClaims = new Map<string, number>();

async function claimStorefrontTranslation(organizationId: string): Promise<boolean> {
  const key = `dealership-translation:${organizationId}`;
  const redis = getRedis();
  if (redis) {
    try {
      return (await redis.set(key, "1", { nx: true, ex: STOREFRONT_CLAIM_SECONDS })) === "OK";
    } catch (error) {
      logError("Storefront translation claim unavailable; claiming in this instance", error);
    }
  }
  const now = Date.now();
  if ((localClaims.get(key) ?? 0) > now) return false;
  localClaims.set(key, now + STOREFRONT_CLAIM_SECONDS * 1000);
  return true;
}

export async function syncDealershipProfileTextFromStorefront(
  organizationId: string,
  caller: AiCallerContext
): Promise<void> {
  if (!(await claimStorefrontTranslation(organizationId))) return;
  await syncDealershipProfileText(organizationId, caller);
}

/** Test seam: forget this instance's claims. */
export function resetStorefrontTranslationClaimsForTests(): void {
  localClaims.clear();
}
