// Dealership service - keeping the dealer's own words in both languages
import type { AiCallerContext } from "@/lib/ai/client";
import type { Locale } from "@/i18n/routing";
import * as dealershipRepo from "@/lib/repositories/dealership";
import { translateDealershipProfile, type DealershipProfileText } from "@/lib/services/ai/translateDealershipProfile";
import { dealershipTranslationPlan, languageColumn, type DealershipTextField } from "@/lib/utils/dealership-text";
import { logError } from "@/lib/utils/errors";

/**
 * Write the dealership's description and address in the language the dealer
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
      const text: DealershipProfileText = { description: "", address: "" };
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
