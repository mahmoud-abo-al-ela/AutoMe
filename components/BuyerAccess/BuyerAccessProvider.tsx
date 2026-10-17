"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "next-intl";
import {
  buyerBlockReason,
  type BuyerAction,
  type BuyerBlockReason,
  type BuyerViewer,
} from "@/lib/auth/buyer-policy";
import { mainSiteUrl } from "@/lib/utils/tenant-host";

const ViewerContext = createContext<{ viewer: BuyerViewer | null; onSubdomain: boolean }>({
  viewer: null,
  onSubdomain: false,
});
const TargetContext = createContext<BuyerTarget | null>(null);

export interface BuyerTarget {
  organizationId: string;
  organizationSlug?: string | null;
  /** On a car's page, so "manage" can open that car rather than the dashboard. */
  carId?: string;
}

export interface BuyerNotice {
  reason: BuyerBlockReason;
  /** The target is one car, not the dealership as a whole. */
  onCar: boolean;
  /** Where the viewer can do what they came for instead, if anywhere. */
  href: { url: string; external: boolean } | null;
}

export function BuyerViewerProvider({
  viewer,
  onSubdomain,
  children,
}: {
  viewer: BuyerViewer | null;
  /** On a dealership's storefront, where main-domain links must be absolute. */
  onSubdomain: boolean;
  children: ReactNode;
}) {
  return <ViewerContext.Provider value={{ viewer, onSubdomain }}>{children}</ViewerContext.Provider>;
}

export function BuyerTargetProvider({
  target,
  children,
}: {
  target: BuyerTarget | null;
  children: ReactNode;
}) {
  return <TargetContext.Provider value={target}>{children}</TargetContext.Provider>;
}

export function useBuyerAccess(target?: BuyerTarget | null) {
  const { viewer: serverViewer, onSubdomain } = useContext(ViewerContext);
  const contextTarget = useContext(TargetContext);
  const locale = useLocale();
  // The viewer is the server's answer from the last render; after signing out
  // it still describes the member. Clerk's live state gates it, as in
  // use-header-access. While Clerk loads, the server's answer stands.
  const { isLoaded, isSignedIn } = useAuth();
  const viewer = !isLoaded || isSignedIn ? serverViewer : null;
  const resolved = target ?? contextTarget;

  const blocked = (action: BuyerAction): BuyerBlockReason | null =>
    resolved ? buyerBlockReason(viewer, resolved.organizationId, action) : null;

  const noticeFor = (action: BuyerAction): BuyerNotice | null => {
    const reason = blocked(action);
    if (!reason || !resolved) return null;
    return { reason, onCar: !!resolved.carId, href: hrefFor(reason, resolved, locale, onSubdomain) };
  };

  return { blocked, can: (action: BuyerAction) => blocked(action) === null, noticeFor };
}

function hrefFor(
  reason: BuyerBlockReason,
  target: BuyerTarget,
  locale: string,
  onSubdomain: boolean,
): BuyerNotice["href"] {
  if (reason === "platformAdmin") {
    const path = `/super-admin/organizations/${target.organizationId}`;
    // Super-admin is main-domain only; from a dealership's subdomain a
    // relative link would be sent back to the storefront's home.
    return onSubdomain
      ? { url: mainSiteUrl(path, locale), external: true }
      : { url: path, external: false };
  }
  if (reason === "ownDealership" && target.organizationSlug) {
    const base = `/org/${target.organizationSlug}`;
    return {
      url: target.carId ? `${base}/cars/${target.carId}/edit` : `${base}/dashboard`,
      external: false,
    };
  }
  return null;
}
