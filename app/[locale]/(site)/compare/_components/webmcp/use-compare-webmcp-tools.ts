"use client";

import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import { findPublicCarsByIds } from "@/hooks/webmcp-public-cars";
import { compareUtils } from "@/lib/utils";
import { comparePageTools, type ComparedCar } from "./compare-tools";

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
