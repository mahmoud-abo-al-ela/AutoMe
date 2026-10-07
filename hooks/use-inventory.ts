"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getInventory, updateCars } from "@/actions/inventory";
import { deleteCar } from "@/actions/cars";
import { queryKeys } from "@/lib/query-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import type { ActionError } from "@/lib/utils/error-messages";
import type { ActionResponse } from "@/lib/utils/response";
import type { InventoryInput } from "@/lib/validations/schemas";
import type { Inventory } from "@/lib/services/dashboard";

export type InventoryView = InventoryInput["view"];
export type InventorySort = InventoryInput["sort"];
export type InventoryFilters = Pick<InventoryInput, "bodyType" | "minYear" | "featured">;

/** What the dealer can do to one or several cars from the table. */
export type CarChange = "markSold" | "hide" | "putOnSale" | "feature" | "unfeature";

const CHANGES = {
  markSold: { update: { status: "SOLD" }, toast: "markedSold" },
  hide: { update: { status: "UNAVAILABLE" }, toast: "hidden" },
  putOnSale: { update: { status: "AVAILABLE" }, toast: "onSale" },
  feature: { update: { featured: true }, toast: "featured" },
  unfeature: { update: { featured: false }, toast: "unfeatured" },
} as const;

function unwrap<T>(response: ActionResponse<T>): T {
  if (!response.success) throw response.error;
  return response.data;
}

/**
 * The dealer's Cars table (canvas: Cars — round 1, Ledger): one status view
 * from the URL, and here the search, filters, sort, page and selection, with
 * the changes made from it. Search, filters and sort reset the page and the
 * selection, so a selection never hides rows the dealer can no longer see.
 */
export function useInventory(view: InventoryView, initial: Inventory | null = null) {
  const t = useTranslations("org.cars.ledger.toasts");
  const fmt = useFormatters();
  const actionError = useActionError();
  const queryClient = useQueryClient();

  const [search, setSearchText] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilterState] = useState<InventoryFilters>({});
  const [order, setOrderState] = useState<{ sort: InventorySort; dir: "asc" | "desc" }>({ sort: "listed", dir: "desc" });
  const [page, setPageState] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // A new view (a link above the table) starts at its first page with nothing selected.
  const [shownView, setShownView] = useState(view);
  if (shownView !== view) {
    setShownView(view);
    setPageState(1);
    setSelected(new Set());
  }

  const restart = () => {
    setPageState(1);
    setSelected(new Set());
  };

  const input: InventoryInput = { view, search: debouncedSearch.trim() || undefined, ...filters, ...order, page };
  // The page arrives with the view's first page already read on the server
  // (default sort, no search or filters), so the table renders with the page
  // instead of showing a second skeleton after the route's own.
  const pristine =
    !input.search && !filters.bodyType && !filters.minYear && !filters.featured && order.sort === "listed" && order.dir === "desc" && page === 1;
  const query = useQuery({
    queryKey: queryKeys.cars.list({ scope: "inventory", ...input }),
    initialData: pristine && initial ? initial : undefined,
    queryFn: async () => unwrap(await getInventory(input)),
    placeholderData: keepPreviousData,
  });

  // A change that empties the last page (marking its cars sold from "On sale") steps back a page.
  if (query.data && page > query.data.totalPages) setPageState(query.data.totalPages);

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
  const fail = (error: unknown) => toast.error(actionError(error as ActionError, t("failed")));

  const queryKey = queryKeys.cars.list({ scope: "inventory", ...input });
  const change = useMutation({
    mutationFn: async ({ carIds, change }: { carIds: string[]; change: CarChange }) =>
      unwrap(await updateCars({ carIds, ...CHANGES[change].update })),
    // The rows show the change at once, so the table never contradicts the
    // toast while the refetch is on its way; a failure puts them back.
    onMutate: async ({ carIds, change }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Inventory>(queryKey);
      if (previous) {
        const ids = new Set(carIds);
        const update = CHANGES[change].update;
        // Only a car on sale has something to fix; one taken off sale loses its note.
        const offSale = "status" in update && update.status !== "AVAILABLE";
        queryClient.setQueryData<Inventory>(queryKey, {
          ...previous,
          cars: previous.cars.map((car) =>
            ids.has(car.id) ? { ...car, ...update, attention: offSale ? null : car.attention } : car,
          ),
        });
      }
      return { previous };
    },
    onSuccess: ({ count }, { change }) => {
      toast.success(t(CHANGES[change].toast, { count, value: fmt.number(count) }));
      setSelected(new Set());
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      fail(error);
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: async (carId: string) => unwrap(await deleteCar(carId)),
    onSuccess: (_data, carId) => {
      toast.success(t("deleted"));
      setSelected((current) => {
        const next = new Set(current);
        next.delete(carId);
        return next;
      });
    },
    onError: fail,
    onSettled: refresh,
  });

  const pendingIds = new Set<string>(
    change.isPending ? (change.variables?.carIds ?? []) : remove.isPending && remove.variables ? [remove.variables] : [],
  );

  return {
    view,
    input,
    search,
    filters,
    order,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    selected,
    pendingIds,
    handlers: {
      setSearch: (value: string) => {
        setSearchText(value);
        restart();
      },
      setFilters: (next: InventoryFilters) => {
        setFilterState(next);
        restart();
      },
      /** Sorting by the column already sorted turns it round; a new column starts with the most first. */
      sortBy: (sort: InventorySort) => {
        setOrderState((current) => ({ sort, dir: current.sort === sort && current.dir === "desc" ? "asc" : "desc" }));
        restart();
      },
      setPage: (next: number) => {
        setPageState(next);
        setSelected(new Set());
      },
      toggle: (id: string) =>
        setSelected((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      /** The header checkbox: select every car on the page, or clear them if all are selected. */
      togglePage: (ids: string[]) =>
        setSelected((current) => (ids.every((id) => current.has(id)) ? new Set() : new Set(ids))),
      clearSelection: () => setSelected(new Set()),
      change: (carIds: string[], next: CarChange) => change.mutateAsync({ carIds, change: next }).catch(() => undefined),
      remove: (carId: string) => remove.mutateAsync(carId).catch(() => undefined),
      retry: () => query.refetch(),
    },
  };
}

export type InventoryData = ReturnType<typeof useInventory>;
