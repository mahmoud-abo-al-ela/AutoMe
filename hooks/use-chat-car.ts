"use client";

import { useQuery } from "@tanstack/react-query";
import { getCarById } from "@/actions/cars-listing";
import { queryKeys } from "@/lib/query-client";

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
