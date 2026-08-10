"use client";


import { getPlanGateStatus } from "@/actions/plan";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export function usePlanUsage(resource: string) {
  const { data: usageData, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard.planUsage(resource),
    queryFn: () => getPlanGateStatus(resource),
    enabled: !!resource,
  });

  const usage = usageData?.success ? usageData.data : null;

  const isNearLimit = usage && usage.limit !== -1 && usage.current >= usage.limit * 0.8;
  const isAtLimit = usage && usage.limit !== -1 && usage.current >= usage.limit;

  return { usage, isLoading, error, isNearLimit, isAtLimit };
}
