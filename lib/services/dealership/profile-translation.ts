// Dealership service - keeping the dealer's own words in both languages
import type { AiCallerContext } from "@/lib/ai/client";
import type { Locale } from "@/i18n/routing";
import * as dealershipRepo from "@/lib/repositories/dealership";
import { translateDealershipProfile, type DealershipProfileText } from "@/lib/services/ai/translateDealershipProfile";
import { dealershipTranslationPlan, languageColumn, type DealershipTextField } from "@/lib/utils/dealership-text";
import { logError } from "@/lib/utils/errors";
import { getRedis } from "@/lib/redis";

/**
 * Write the dealership's description, address and financing note in the language the dealer
 * did not, where missing or made from older text. Fields written in the same
 * language go in one call; a dealer who mixes languages costs at most two.
 * Run after a profile save, and after a storefront view finds a field
 * untranslated (text saved before this existed), both via `after()` so nobody
 * waits on the model.
 *
 * Never throws: a failed or skipped translation leaves the storefront showing
 * the dealer's own text, marked, to the other language's readers — and the
 * next save or view tries again.
 */
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

/**
 * Whether this storefront visit is the one that translates the dealership's
 * text. Without a claim, every visit while a translation was pending — or
 * after one failed — started another model call for the same text. One visit
 * per dealership per ten minutes now does; a failure is retried after that,
 * not on every visit. Redis (SET NX) holds the claim across instances; if it
 * is not configured or does not answer, a claim in this instance still keeps
 * one instance from stampeding.
 */
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

/**
 * The storefront's trigger: translate untranslated text found on a view, once
 * per dealership per claim window however many people are looking. A profile
 * save calls syncDealershipProfileText directly — the dealer just changed the
 * text, so it always runs.
 */
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
