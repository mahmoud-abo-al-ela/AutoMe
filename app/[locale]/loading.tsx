"use client";

import { usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import { RoadLoader } from "@/components/brand";
import { getOrgSlugFromPath, isSuperAdminPath } from "@/lib/org/client";

/**
 * The boundary above every locale route, shown on a cold load or reload while
 * the route's layout resolves (the public layout awaits the user and the
 * dealership). The public site and the dealer dashboard get the road loader;
 * the super-admin keeps its own.
 *
 * The site palette applies only under data-theme="site", which the layouts
 * set once they mount — before that, this wrapper sets it (in work mode for
 * the dashboard), so the loader appears in the right colours. The site font
 * is not loaded here on purpose (the super-admin would pay for it too); on a
 * cold load the plate shows the fallback face for that moment.
 */
export default function LoadingUI() {
  const pathname = usePathname();

  if (isSuperAdminPath(pathname)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loading />
      </div>
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
