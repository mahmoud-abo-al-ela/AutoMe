"use client";

import { getCarsByIds } from "@/actions/cars-listing";

/**
 * Of these ids, the cars the public may see — the site's one visibility rule,
 * through the action the compare page uses. That action refuses a list that
 * finds no car at all ("errors.compare.noCars"); to a WebMCP tool asking about
 * a hidden or unknown car, that is an empty answer, not a failure.
 */
export async function findPublicCarsByIds<Car extends { id: string }>(ids: string[]): Promise<Car[]> {
  const response = await getCarsByIds(ids);
  if (!response.success) {
    if (response.error.messageKey === "errors.compare.noCars") return [];
    throw new Error(response.error.message);
  }
  return (response.data as (Car | null)[]).filter((car): car is Car => car !== null);
}
