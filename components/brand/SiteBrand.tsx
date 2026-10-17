"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { PLATE_BAND_COOKIE, type PlateBand } from "@/lib/org/client";

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

export function useRememberPlateBand(band: PlateBand) {
  useEffect(() => {
    document.cookie = `${PLATE_BAND_COOKIE}=${band}; path=/; max-age=31536000; samesite=lax`;
  }, [band]);
}
