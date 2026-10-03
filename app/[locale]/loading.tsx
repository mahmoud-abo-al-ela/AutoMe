"use client";

import { usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import { RoadLoader } from "@/components/brand";
import { isDashboardPath } from "@/lib/org/client";

/**
 * The boundary above every locale route, shown on a cold load or reload while
 * the route's layout resolves (the public layout awaits the user and the
 * dealership). Public routes — the site, sign-in, sign-up — get the road
 * loader; dashboard routes keep theirs.
 *
 * The public site's palette applies only under data-theme="site", which the
 * (site) layout sets once it mounts — before that, this wrapper sets it, so
 * the loader appears in the site's colours. The site font is not loaded here
 * on purpose (the dashboards would pay for it too); on a cold load the plate
 * shows the fallback face for that moment.
 */
export default function LoadingUI() {
  const pathname = usePathname();

  if (isDashboardPath(pathname)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loading />
      </div>
    );
  }

  return (
    <div data-theme="site" className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <RoadLoader />
    </div>
  );
}
