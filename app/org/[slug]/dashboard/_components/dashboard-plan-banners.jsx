"use client";

import { usePlanUsage } from "@/hooks/use-plan-usage";
import { UpgradeBanner } from "@/components/common/UpgradeBanner";

function BannerWrapper({ resource, orgSlug }) {
  const { usage, isLoading } = usePlanUsage(resource);

  if (isLoading || !usage) return null;

  return (
    <UpgradeBanner
      resource={resource}
      current={usage.current}
      limit={usage.limit}
      planType={usage.planType}
      orgSlug={orgSlug}
    />
  );
}

export function DashboardPlanBanners({ orgSlug }) {
  return (
    <div className="flex flex-col w-full">
      <BannerWrapper resource="cars" orgSlug={orgSlug} />
      <BannerWrapper resource="members" orgSlug={orgSlug} />
      <BannerWrapper resource="aiProcessing" orgSlug={orgSlug} />
    </div>
  );
}
