"use client";

import { createContext, useContext, type ReactNode } from "react";

const DealerPitchContext = createContext(true);

export function DealerPitchProvider({ show, children }: { show: boolean; children: ReactNode }) {
  return <DealerPitchContext.Provider value={show}>{children}</DealerPitchContext.Provider>;
}

/** Its children, only for a visitor the dealer pitch is for. */
export function DealerPitchOnly({ children }: { children: ReactNode }) {
  return useContext(DealerPitchContext) ? children : null;
}
