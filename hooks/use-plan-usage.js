"use client";

import { useState, useEffect } from "react";
import { getPlanGateStatus } from "@/actions/plan";

export function usePlanUsage(resource) {
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUsage() {
      try {
        setIsLoading(true);
        const res = await getPlanGateStatus(resource);
        if (res.success && isMounted) {
          setUsage(res.data);
        } else if (isMounted) {
          setError(res.error);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (resource) {
      fetchUsage();
    }
  }, [resource]);

  const isNearLimit = usage && usage.limit !== -1 && usage.current >= usage.limit * 0.8;
  const isAtLimit = usage && usage.limit !== -1 && usage.current >= usage.limit;

  return { usage, isLoading, error, isNearLimit, isAtLimit };
}
