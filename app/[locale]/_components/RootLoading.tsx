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

/**
 * The skeleton for the admin page at a path — the same one the page's own
 * loading.tsx shows when moving between admin pages. A page without one shows
 * the top bar alone until it arrives.
 */
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

/**
 * The boundary above every locale route, shown on a cold load or reload while
 * the route's layout resolves (the public layout awaits the user and the
 * dealership; the super-admin layout checks the user is an admin). On a reload
 * the layout and the page load together, so this is usually the only loader
 * shown; moving between pages shows the route's own loader instead.
 *
 * The super-admin gets its own frame here — the top bar, then the page's own
 * skeleton, never the road loader — so a reload looks the same as moving
 * between admin pages. Everywhere else gets the road
 * loader on its own.
 *
 * The site palette applies only under data-theme="site", which the layouts
 * set once they mount — before that, this wrapper sets it (in work mode for
 * the dashboard), so the loader appears in the right colours. The site font
 * is not loaded here for the public site and the dashboard; on a cold load
 * the plate shows the fallback face for that moment.
 */
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
