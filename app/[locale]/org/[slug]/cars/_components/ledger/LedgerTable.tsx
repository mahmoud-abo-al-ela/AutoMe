"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { PricePlate } from "@/components/brand/PricePlate";
import { FairPriceGauge } from "@/components/brand/FairPriceGauge";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarChange, InventoryData, InventorySort } from "@/hooks/use-inventory";
import type { InventoryRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";
import { CarThumb, FeaturedTag, MARKET_TONE, reasonTone, StatusPill, useCarName, useLedgerText } from "./ledger-shared";
import { RowMenu } from "./RowMenu";

/**
 * The Cars table from tablet width up: a checkbox to select, the car with the
 * one thing to fix under its name, the price as a plate, where it sits among
 * similar cars, interest, days listed, status, and the row's other actions.
 * Price, saves, test drives and days listed sort; the header says which and
 * which way (aria-sort).
 *
 * It fits its frame at every width rather than scrolling: below 1280px the
 * gauge, saves and test drives step out, below 1024px the market words and
 * days listed too — the phone rows take over below 768px.
 */
export function LedgerTable({
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
  const t = useTranslations("org.cars.ledger.table");
  const ids = cars.map((car) => car.id);
  const allSelected = ids.length > 0 && ids.every((id) => state.selected.has(id));
  const someSelected = !allSelected && ids.some((id) => state.selected.has(id));

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-caption">
        <thead>
          <tr className="bg-muted/60 text-start text-foreground">
            <th scope="col" className="w-12 px-4 py-3 text-center">
              <Checkbox
                aria-label={t("selectAll")}
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={() => state.handlers.togglePage(ids)}
                className="size-5 border-[#8c8170] bg-field"
              />
            </th>
            <th scope="col" className="px-3 py-3 text-start font-semibold">
              {t("car")}
            </th>
            <SortHeader state={state} sort="price" label={t("price")} />
            <th scope="col" className="hidden px-3 py-3 text-center font-semibold lg:table-cell">
              {t("market")}
            </th>
            <SortHeader state={state} sort="saves" label={t("saves")} className="hidden xl:table-cell" />
            <SortHeader state={state} sort="drives" label={t("drives")} className="hidden xl:table-cell" />
            <SortHeader state={state} sort="listed" label={t("listed")} className="hidden lg:table-cell" />
            <th scope="col" className="px-3 py-3 text-center font-semibold">
              {t("status")}
            </th>
            <th scope="col" className="w-14 px-4 py-3 text-center">
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <Row
              key={car.id}
              car={car}
              base={base}
              selected={state.selected.has(car.id)}
              busy={state.pendingIds.has(car.id)}
              onToggle={() => state.handlers.toggle(car.id)}
              onChange={(change) => state.handlers.change([car.id], change)}
              onDelete={() => onDelete(car)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  state,
  sort,
  label,
  className,
}: {
  state: InventoryData;
  sort: InventorySort;
  label: string;
  className?: string;
}) {
  const t = useTranslations("org.cars.ledger.table");
  const active = state.order.sort === sort;
  const Arrow = state.order.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (state.order.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("whitespace-nowrap px-3 py-2 text-center font-semibold", className)}
    >
      <button
        type="button"
        onClick={() => state.handlers.sortBy(sort)}
        aria-label={active ? undefined : t("sortBy", { column: label })}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-1 rounded-[8px] px-1.5 -mx-1.5 hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        )}
      >
        {label}
        {active ? <Arrow aria-hidden className="size-4" /> : <span aria-hidden className="size-4" />}
      </button>
    </th>
  );
}

function Row({
  car,
  base,
  selected,
  busy,
  onToggle,
  onChange,
  onDelete,
}: {
  car: InventoryRow;
  base: string;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
  onChange: (change: CarChange) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("org.cars.ledger");
  const fmt = useFormatters();
  const carName = useCarName();
  const text = useLedgerText();
  const name = carName(car);
  const market = text.market(car.marketPercent);

  return (
    <tr
      aria-busy={busy || undefined}
      className={cn(
        "border-t border-border transition-colors",
        selected ? "bg-[#e7eef8]" : "hover:bg-muted/40",
        busy && "opacity-60",
      )}
    >
      <td className="px-4 py-2.5 text-center">
        <Checkbox
          aria-label={t("table.select", { car: name })}
          checked={selected}
          onCheckedChange={onToggle}
          className="size-5 border-[#8c8170] bg-field"
        />
      </td>
      <td className="px-3 py-2.5">
        <Link href={`${base}/cars/${car.id}/edit`} className="group flex min-w-0 items-center gap-3 rounded-[8px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <CarThumb src={car.image} className="h-11 w-16" />
          <span className="flex min-w-0 max-w-[12rem] flex-col xl:max-w-[20rem]">
            <span dir="auto" className="truncate text-body font-semibold text-[#1d4e9e] group-hover:underline">
              {name}
            </span>
            {car.attention && (
              <span className={cn("text-micro font-semibold", reasonTone(car.attention))}>{text.reason(car.attention)}</span>
            )}
          </span>
        </Link>
      </td>
      <td className="px-3 py-2.5 text-center">
        <PricePlate amount={car.price} currency={car.priceCurrency} size="sm" />
      </td>
      <td className="hidden px-3 py-2.5 lg:table-cell">
        <span className="flex items-center justify-center gap-2.5">
          <span aria-hidden className="hidden w-20 xl:block">
            <FairPriceGauge percent={car.marketPercent} />
          </span>
          <span className={cn("whitespace-nowrap", MARKET_TONE[market.verdict])}>{market.text}</span>
        </span>
      </td>
      <td className="hidden px-3 py-2.5 text-center tabular-nums xl:table-cell">{fmt.number(car.saves)}</td>
      <td className="hidden px-3 py-2.5 text-center tabular-nums xl:table-cell">{fmt.number(car.testDrives)}</td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-center tabular-nums lg:table-cell">{text.days(car.daysListed)}</td>
      <td className="px-3 py-2.5">
        <span className="flex flex-wrap items-center justify-center gap-1.5">
          <StatusPill status={car.status} />
          {car.featured && <FeaturedTag />}
        </span>
      </td>
      <td className="px-4 py-2.5 text-center">
        <RowMenu car={car} name={name} base={base} busy={busy} onChange={onChange} onDelete={onDelete} />
      </td>
    </tr>
  );
}
