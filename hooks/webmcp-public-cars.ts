"use client";

import { getCarsByIds } from "@/actions/cars-listing";

export async function findPublicCarsByIds<Car extends { id: string }>(ids: string[]): Promise<Car[]> {
  const response = await getCarsByIds(ids);
  if (!response.success) {
    if (response.error.messageKey === "errors.compare.noCars") return [];
    throw new Error(response.error.message);
  }
  return (response.data as (Car | null)[]).filter((car): car is Car => car !== null);
}
