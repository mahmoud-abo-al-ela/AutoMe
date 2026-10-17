import * as carRepository from "@/lib/repositories/car";

export async function refreshSearchVocabulary(): Promise<void> {
  await carRepository.refreshSearchTerms();
}
