import { toLatinDigits } from "@/lib/utils/phone";

export function numbersHold(text: string, allowed: number[]): boolean {
  const permitted = new Set(allowed.map(String));
  const found = toLatinDigits(text).replace(/(\d),(\d{3})/g, "$1$2").match(/\d+/g) ?? [];
  return found.every((n) => permitted.has(String(Number(n))));
}
