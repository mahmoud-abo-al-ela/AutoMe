"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CarFront, SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { useInventory, type InventoryData, type InventoryView } from "@/hooks/use-inventory";
import type { Inventory, InventoryRow } from "@/lib/services/dashboard";
import { cn } from "@/lib/utils";
import { LedgerToolbar } from "./LedgerToolbar";
import { LedgerTable } from "./LedgerTable";
import { LedgerPhoneList } from "./LedgerPhoneList";
import { BulkBar } from "./BulkBar";
import { DeleteCarDialog } from "./DeleteCarDialog";

const VIEW_STATUS = { available: "AVAILABLE", unavailable: "UNAVAILABLE", sold: "SOLD" } as const;

/**
 * The Cars table (canvas: Cars — round 1, "1 · Ledger"; page pattern 1, list):
 * toolbar, one framed table — rows on a phone — and pages that are always
 * there, even when there is one. The status views above it are links the
 * server renders (they carry the counts); everything below is this.
 */
export function CarsLedger({ view, base, initial }: { view: InventoryView; base: string; initial: Inventory | null }) {
  const state = useInventory(view, initial);
  const [deleting, setDeleting] = useState<InventoryRow | null>(null);
  const cars = state.data?.cars ?? [];

  return (
    <div className="flex flex-col gap-4">
      <LedgerToolbar state={state} />

      <div className="overflow-hidden rounded-sheet border border-border bg-card">
        {state.isLoading ? (
          <LedgerSkeleton />
        ) : state.isError && !state.data ? (
          <LoadFailed onRetry={state.handlers.retry} />
        ) : cars.length === 0 ? (
          <Empty state={state} base={base} />
        ) : (
          <div aria-busy={state.isFetching || undefined} className={cn("transition-opacity", state.isFetching && "opacity-70")}>
            <div className="hidden md:block">
              <LedgerTable state={state} cars={cars} base={base} onDelete={setDeleting} />
            </div>
            <div className="md:hidden">
              <LedgerPhoneList state={state} cars={cars} base={base} onDelete={setDeleting} />
            </div>
          </div>
        )}
        {state.data && <Pages state={state} />}
      </div>

      <BulkBar state={state} cars={cars} />
      <DeleteCarDialog car={deleting} onClose={() => setDeleting(null)} onDelete={state.handlers.remove} />
    </div>
  );
}

function Pages({ state }: { state: InventoryData }) {
  const t = useTranslations("org.cars.ledger.pages");
  const fmt = useFormatters();
  const data = state.data!;
  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  return (
    <nav
      aria-label={t("label")}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-muted-foreground"
    >
      <span className="tabular-nums">{t("status", { from: fmt.number(from), to: fmt.number(to), total: fmt.number(data.total) })}</span>
      <span className="flex gap-2">
        <Button
          variant="outline-strong"
          size="control"
          className="h-11 border bg-field"
          disabled={data.page <= 1}
          onClick={() => state.handlers.setPage(data.page - 1)}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline-strong"
          size="control"
          className="h-11 border bg-field"
          disabled={data.page >= data.totalPages}
          onClick={() => state.handlers.setPage(data.page + 1)}
        >
          {t("next")}
        </Button>
      </span>
    </nav>
  );
}

/** Rows waiting for their cars; also the route's loading state (cars/loading.tsx), so the two are one. */
export function LedgerSkeleton() {
  return (
    <ul aria-busy className="divide-y divide-border">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-3">
          <span className="skeleton-shimmer h-11 w-16 rounded-[8px]" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="skeleton-shimmer h-4 w-1/3 rounded" />
            <span className="skeleton-shimmer h-3 w-1/5 rounded" />
          </span>
          <span className="skeleton-shimmer hidden h-8 w-28 rounded md:block" />
        </li>
      ))}
    </ul>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("org.cars.ledger");
  return (
    <div role="alert" className="flex flex-col items-start gap-3 px-6 py-6">
      <p className="text-body">{t("loadFailed")}</p>
      <Button variant="outline-strong" size="control" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

/**
 * No rows, for one of three reasons, each with its own way on: the search or
 * a filter matched nothing (clear them), a status view is empty (say what
 * lands there, show all cars), or the dealership has no cars yet (add one).
 */
function Empty({ state, base }: { state: InventoryData; base: string }) {
  const t = useTranslations("org.cars.ledger.empty");
  const tCars = useTranslations("org.cars");
  const filtered = !!state.search.trim() || Object.values(state.filters).some(Boolean);
  const status = state.view === "all" ? null : VIEW_STATUS[state.view];

  if (filtered) {
    return (
      <EmptyFrame icon={<SearchX className="size-6" />} title={t("filteredTitle")} body={t("filteredBody")}>
        <Button
          variant="outline-strong"
          size="control"
          className="mt-2 bg-field"
          onClick={() => {
            state.handlers.setSearch("");
            state.handlers.setFilters({});
          }}
        >
          {t("showAll")}
        </Button>
      </EmptyFrame>
    );
  }

  if (status) {
    return (
      <EmptyFrame icon={<CarFront className="size-6" />} body={t(status)}>
        <Link href={`${base}/cars`} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "mt-2 bg-field")}>
          {t("showAll")}
        </Link>
      </EmptyFrame>
    );
  }

  return (
    <EmptyFrame icon={<CarFront className="size-6" />} title={t("title")} body={t("body")}>
      <Link href={`${base}/cars/create`} className={cn(buttonVariants({ variant: "inverse", size: "control" }), "mt-2")}>
        {tCars("addCar")}
      </Link>
    </EmptyFrame>
  );
}

function EmptyFrame({ icon, title, body, children }: { icon: ReactNode; title?: string; body: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span aria-hidden className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      {title && <p className="text-body font-semibold">{title}</p>}
      <p className="max-w-sm text-caption text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
