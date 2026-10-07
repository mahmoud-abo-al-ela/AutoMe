"use client";

import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import type { InventoryData } from "@/hooks/use-inventory";
import type { InventoryRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";
import { CarThumb, FeaturedTag, reasonTone, StatusPill, useCarName, useLedgerText } from "./ledger-shared";
import { RowMenu } from "./RowMenu";

/**
 * The same cars on a phone (canvas: "Any of the three on a phone"): framed
 * rows of the car, its price and status, and the one note that matters most —
 * what to fix if anything, else how many buyers saved it. The row opens the
 * car's editor; its other actions sit beside it. No selection on a phone:
 * changing several cars at once is a desk job.
 */
export function LedgerPhoneList({
  state,
  cars,
  base,
  onDelete,
}: {
  state: InventoryData;
  cars: InventoryRow[];
  base: string;
  onDelete: (car: InventoryRow) => void;
}) {
  const fmt = useFormatters();
  const carName = useCarName();
  const text = useLedgerText();

  return (
    <ul>
      {cars.map((car) => {
        const name = carName(car);
        const busy = state.pendingIds.has(car.id);
        return (
          <li key={car.id} aria-busy={busy || undefined} className={cn("flex items-center gap-1 border-t border-border first:border-t-0", busy && "opacity-60")}>
            <Link
              href={`${base}/cars/${car.id}/edit`}
              className="flex min-w-0 flex-1 items-center gap-3 py-3 ps-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <CarThumb src={car.image} className="h-[60px] w-[84px]" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span dir="auto" className="truncate text-body font-semibold">
                  {name}
                </span>
                <span className="text-caption font-bold tabular-nums">{fmt.price(car.price, car.priceCurrency)}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusPill status={car.status} />
                  {car.featured && <FeaturedTag />}
                  <span className={cn("text-micro font-semibold", car.attention ? reasonTone(car.attention) : "text-muted-foreground")}>
                    {car.attention ? text.reason(car.attention) : text.saves(car.saves)}
                  </span>
                </span>
              </span>
            </Link>
            <span className="pe-1.5">
              <RowMenu
                car={car}
                name={name}
                base={base}
                busy={busy}
                onChange={(change) => state.handlers.change([car.id], change)}
                onDelete={() => onDelete(car)}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
