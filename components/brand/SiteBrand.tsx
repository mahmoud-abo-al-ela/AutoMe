"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { PLATE_BAND_COOKIE, type PlateBand } from "@/lib/org/client";

/**
 * The public site's plate: the name on it (the dealership's on its subdomain,
 * otherwise unset — the Logo's own default, AutoMe) and its band (who is
 * signed in, lib/org/client: plateBandFor). Provided once by the (site)
 * layout, which already resolved the organization and the user, so client
 * pieces such as the road loader carry the same plate as the header without a
 * lookup of their own.
 */
const SiteBrandContext = createContext<{ name?: string; band: PlateBand }>({ band: "buyer" });

export function SiteBrandProvider({
  name,
  band = "buyer",
  children,
}: {
  name?: string | null;
  band?: PlateBand;
  children: ReactNode;
}) {
  return (
    <SiteBrandContext.Provider value={{ name: name ?? undefined, band }}>{children}</SiteBrandContext.Provider>
  );
}

export function useSiteBrandName(): string | undefined {
  return useContext(SiteBrandContext).name;
}

export function useSitePlateBand(): PlateBand {
  return useContext(SiteBrandContext).band;
}

/**
 * Remember the band for the next cold load. The root loading screen shows
 * before any layout has looked the user up, so it reads this cookie instead
 * (app/[locale]/loading.tsx). Cosmetic only: a forged value changes nobody's
 * plate but the sender's own.
 */
export function useRememberPlateBand(band: PlateBand) {
  useEffect(() => {
    document.cookie = `${PLATE_BAND_COOKIE}=${band}; path=/; max-age=31536000; samesite=lax`;
  }, [band]);
}
