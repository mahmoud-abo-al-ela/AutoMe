import * as carRepository from "@/lib/repositories/car";

/**
 * Rebuild the search's vocabulary from the cars listed now — the words typo
 * correction proposes from (lib/repositories/car/search-terms.ts). Run by the
 * `search-terms` job after cars or dealerships change, and daily by cron.
 */
export async function refreshSearchVocabulary(): Promise<void> {
  await carRepository.refreshSearchTerms();
}
