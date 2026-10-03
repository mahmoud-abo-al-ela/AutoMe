"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the dealer pitch is for this visitor (lib/org/client:
 * showsDealerPitch), answered once by the (site) layout, which already has
 * the user and the organization. Pages read it through DealerPitchOnly
 * instead of looking the user up again.
 */
const DealerPitchContext = createContext(true);

export function DealerPitchProvider({ show, children }: { show: boolean; children: ReactNode }) {
  return <DealerPitchContext.Provider value={show}>{children}</DealerPitchContext.Provider>;
}

/** Its children, only for a visitor the dealer pitch is for. */
export function DealerPitchOnly({ children }: { children: ReactNode }) {
  return useContext(DealerPitchContext) ? children : null;
}
