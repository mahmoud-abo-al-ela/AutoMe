"use client";

import { usePathname } from "next/navigation";
import { RoadLoader } from "@/components/brand";
import { routing } from "@/i18n/routing";
import { getOrgSlugFromPath, isSuperAdminPath } from "@/lib/org/client";
import { AdminFrame } from "./(super-admin)/super-admin/_components/AdminFrame";
import { AdminPageSkeleton } from "./(super-admin)/super-admin/_components/AdminPageSkeleton";
import { OverviewSkeleton } from "./(super-admin)/super-admin/_components/OverviewSkeleton";

/** The super-admin home itself, `/{locale}/super-admin`, rather than a page under it. */
function isSuperAdminHome(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  return segments.length === start + 1 && segments[start] === "super-admin";
}

/**
 * The boundary above every locale route, shown on a cold load or reload while
 * the route's layout resolves (the public layout awaits the user and the
 * dealership; the super-admin layout checks the user is an admin). On a reload
 * the layout and the page load together, so this is usually the only loader
 * shown; moving between pages shows the route's own loader instead.
 *
 * The super-admin gets its own frame here — the top bar, then the overview's
 * skeleton or the generic page skeleton, never the road loader — so a reload
 * looks the same as moving between admin pages. Everywhere else gets the road
 * loader on its own.
 *
 * The site palette applies only under data-theme="site", which the layouts
 * set once they mount — before that, this wrapper sets it (in work mode for
 * the dashboard), so the loader appears in the right colours. The site font
 * is not loaded here for the public site and the dashboard; on a cold load
 * the plate shows the fallback face for that moment.
 */
export default function LoadingUI() {
  const pathname = usePathname();

  if (isSuperAdminPath(pathname)) {
    return (
      <AdminFrame>{isSuperAdminHome(pathname) ? <OverviewSkeleton /> : <AdminPageSkeleton />}</AdminFrame>
    );
  }

  return (
    <div
      data-theme="site"
      data-surface={getOrgSlugFromPath(pathname) ? "work" : undefined}
      className="flex min-h-screen items-center justify-center bg-background text-foreground"
    >
      <RoadLoader />
    </div>
  );
}
