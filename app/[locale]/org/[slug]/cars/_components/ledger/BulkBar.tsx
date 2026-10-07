"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarChange, InventoryData } from "@/hooks/use-inventory";
import type { InventoryRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";

/** Each action, and whether it would change any of the selected cars — one that would not is left out. */
const ACTIONS: { change: Exclude<CarChange, "unfeature">; applies: (car: InventoryRow) => boolean }[] = [
  { change: "markSold", applies: (car) => car.status !== "SOLD" },
  { change: "hide", applies: (car) => car.status !== "UNAVAILABLE" },
  { change: "putOnSale", applies: (car) => car.status !== "AVAILABLE" },
  { change: "feature", applies: (car) => !car.featured },
];

/**
 * What to do with the selected cars. It floats over the foot of the page
 * rather than pushing the table down, so selecting a row never moves the row
 * under the pointer. Every change here is undone from a row's menu, so none
 * asks first.
 */
export function BulkBar({ state, cars }: { state: InventoryData; cars: InventoryRow[] }) {
  const t = useTranslations("org.cars.ledger.bulk");
  const fmt = useFormatters();
  const ids = [...state.selected];
  const count = ids.length;
  const busy = ids.some((id) => state.pendingIds.has(id));
  const chosen = cars.filter((car) => state.selected.has(car.id));

  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 hidden justify-center px-4 md:flex">
      <section
        aria-label={t("label")}
        className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-control bg-inverse px-4 py-2.5 text-caption text-inverse-foreground shadow-[0_12px_32px_-8px_rgb(23_24_27/0.45)]"
      >
        <p role="status" className="me-2 font-semibold tabular-nums">
          {t("selected", { count, value: fmt.number(count) })}
        </p>
        {ACTIONS.filter((action) => chosen.some(action.applies)).map((action) => (
          <button
            key={action.change}
            type="button"
            disabled={busy}
            onClick={() => state.handlers.change(ids, action.change)}
            className={cn(
              "h-9 cursor-pointer rounded-[10px] border border-white/30 px-3 transition-colors hover:bg-white/10 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60 disabled:opacity-50",
            )}
          >
            {t(action.change)}
          </button>
        ))}
        <button
          type="button"
          onClick={state.handlers.clearSelection}
          className="ms-2 h-9 cursor-pointer rounded-[10px] px-3 text-[#d9d6d0] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
          {t("clear")}
        </button>
      </section>
    </div>
  );
}
