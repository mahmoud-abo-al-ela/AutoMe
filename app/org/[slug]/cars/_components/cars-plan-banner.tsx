"use client";

import { usePlanUsage } from "@/hooks/use-plan-usage";
import { UpgradeBanner } from "@/components/common/UpgradeBanner";

export function CarsPlanBanner({ orgSlug }: { orgSlug: string }) {
  const { usage, isLoading } = usePlanUsage("cars");

  if (isLoading || !usage) return null;

  return (
    <UpgradeBanner
      resource="cars"
      current={usage.current}
      limit={usage.limit}
      planType={usage.planType}
      orgSlug={orgSlug}
    />
  );
}
