import { toLatinDigits } from "@/lib/utils/phone";

/**
 * Whether every number in the model's summary is one of the week's real
 * figures. The model is handed the numbers and asked only for words; a
 * number it made up — a "12 test drives" where there were 2 — is exactly the
 * error a dealer would act on, so a summary that carries one is dropped and
 * the email goes out with the numbers alone.
 *
 * Arabic-Indic digits are read as Western, and "1,500" as 1500.
 */
export function numbersHold(text: string, allowed: number[]): boolean {
  const permitted = new Set(allowed.map(String));
  const found = toLatinDigits(text).replace(/(\d),(\d{3})/g, "$1$2").match(/\d+/g) ?? [];
  return found.every((n) => permitted.has(String(Number(n))));
}
