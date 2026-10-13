"use client";

import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { findPublicCarsByIds } from "@/hooks/webmcp-public-cars";
import { compareUtils } from "@/lib/utils";
import { comparePageTools, type ComparedCar } from "./compare-tools";

/**
 * Offer the compare page's tool (./compare-tools.ts) to a browser agent. The
 * comparison is changed the way the compare tray changes it — the stored list
 * and the event the page listens for — so the page shows it at once.
 */
export function useCompareWebMcpTools(): void {
  useWebMcpTools(
    comparePageTools({
      findPublicCars: (ids) => findPublicCarsByIds<ComparedCar>(ids),
      showComparison: (ids) => {
        compareUtils.clearCompareList();
        for (const id of ids) compareUtils.addToCompare(id);
        window.dispatchEvent(new Event("compareListUpdated"));
      },
    })
  );
}
