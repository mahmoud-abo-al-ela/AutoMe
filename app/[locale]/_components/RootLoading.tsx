"use client";

import { usePathname } from "next/navigation";
import { RoadLoader } from "@/components/brand";
import { routing } from "@/i18n/routing";
import { getOrgSlugFromPath, isSuperAdminPath, type PlateBand } from "@/lib/org/client";
import { AdminFrame } from "../(super-admin)/super-admin/_components/AdminFrame";
import { OverviewSkeleton } from "../(super-admin)/super-admin/_components/OverviewSkeleton";
import DealershipsLoading from "../(super-admin)/super-admin/organizations/(list)/loading";
import DealershipLoading from "../(super-admin)/super-admin/organizations/[id]/loading";
import CreateDealershipLoading from "../(super-admin)/super-admin/organizations/create/loading";
import UsersLoading from "../(super-admin)/super-admin/users/(list)/loading";
import UserLoading from "../(super-admin)/super-admin/users/[id]/loading";
import PlansLoading from "../(super-admin)/super-admin/plans/loading";
import SessionsLoading from "../(super-admin)/super-admin/impersonation/loading";
import ActivityLoading from "../(super-admin)/super-admin/audit-logs/loading";
import AnalyticsLoading from "../(super-admin)/super-admin/analytics/loading";

function adminSkeleton(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  const [section, id, sub] = segments.slice(start + 1);
  if (!section) return <OverviewSkeleton />;
  if (section === "organizations" && !id) return <DealershipsLoading />;
  if (section === "organizations" && id === "create") return <CreateDealershipLoading />;
  if (section === "organizations" && id !== "create" && !sub) return <DealershipLoading />;
  if (section === "users" && !id) return <UsersLoading />;
  if (section === "users" && !sub) return <UserLoading />;
  if (section === "plans" && !id) return <PlansLoading />;
  if (section === "impersonation" && !id) return <SessionsLoading />;
  if (section === "audit-logs" && !id) return <ActivityLoading />;
  if (section === "analytics" && !id) return <AnalyticsLoading />;
  return null;
}

export function RootLoading({ band }: { band: PlateBand }) {
  const pathname = usePathname();

  if (isSuperAdminPath(pathname)) {
    return <AdminFrame>{adminSkeleton(pathname)}</AdminFrame>;
  }

  return (
    <div
      data-theme="site"
      data-surface={getOrgSlugFromPath(pathname) ? "work" : undefined}
      className="flex min-h-screen items-center justify-center bg-background text-foreground"
    >
      <RoadLoader band={band} />
    </div>
  );
}
