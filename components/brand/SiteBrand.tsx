"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The name on the public site's plate: the dealership's on its subdomain,
 * otherwise unset (the Logo's own default, AutoMe). Provided once by the
 * (site) layout, which already resolved the organization, so client pieces
 * such as the road loader can carry the same name as the header without a
 * lookup of their own.
 */
const SiteBrandContext = createContext<string | undefined>(undefined);

export function SiteBrandProvider({ name, children }: { name?: string | null; children: ReactNode }) {
  return <SiteBrandContext.Provider value={name ?? undefined}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrandName(): string | undefined {
  return useContext(SiteBrandContext);
}
