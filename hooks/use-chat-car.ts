"use client";

import { useQuery } from "@tanstack/react-query";
import { getCarById } from "@/actions/cars-listing";
import { queryKeys } from "@/lib/query-client";

/**
 * The car a conversation is about, as it is now. The channel carries a
 * snapshot taken when the conversation started — its price and status go
 * stale — so every chat header reads the live car instead. Shared by the
 * floating chat and the inbox, so a car opened in both is fetched once.
 */
export function useChatCar(carId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.cars.chat(carId ?? ""),
    queryFn: async () => {
      const response = await getCarById(carId as string);
      if (!response.success) throw response.error;
      return response.data;
    },
    enabled: Boolean(carId),
    staleTime: 30_000,
  });
}
