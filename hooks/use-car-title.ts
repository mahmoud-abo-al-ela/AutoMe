"use client";

import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getCarTitles } from "@/actions/cars-listing";
import type { Locale } from "@/i18n/routing";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";

interface CarTitleRow {
  id: string;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  make: string;
  model: string;
  year: number;
}

/** Matches carTitlesRequestSchema's max. */
const BATCH_MAX = 50;
const pending = new Map<string, Array<(row: CarTitleRow | null) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  const batch = new Map(pending);
  pending.clear();
  const ids = [...batch.keys()];
  for (let i = 0; i < ids.length; i += BATCH_MAX) {
    const chunk = ids.slice(i, i + BATCH_MAX);
    let rows: Record<string, CarTitleRow> = {};
    try {
      const response = await getCarTitles(chunk);
      if (response.success) rows = response.data as Record<string, CarTitleRow>;
    } catch {
      // Falls back to the conversation's saved title below.
    }
    for (const id of chunk) batch.get(id)?.forEach((resolve) => resolve(rows[id] ?? null));
  }
}

/**
 * One car's title row, fetched together with every other title asked for in
 * the same moment — a conversation list renders its rows in one pass, so a
 * list of twenty is one request, not twenty queued server actions.
 */
function loadCarTitle(id: string): Promise<CarTitleRow | null> {
  return new Promise((resolve) => {
    const waiting = pending.get(id);
    if (waiting) waiting.push(resolve);
    else pending.set(id, [resolve]);
    timer ??= setTimeout(flush, 10);
  });
}

/**
 * A car's title in the reader's language, for a conversation list. The
 * channel's saved snapshot holds only the English title; this reads the car
 * itself. `loading` is true until it arrives — callers draw a placeholder
 * rather than the English snapshot, which then flashed into Arabic. The
 * snapshot is only a fallback for a car that is gone.
 */
export function useCarTitle(carId: string | null | undefined, fallback: string) {
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const { data, isPending } = useQuery({
    queryKey: ["cars", "title", carId],
    queryFn: () => loadCarTitle(carId as string),
    enabled: Boolean(carId),
    staleTime: 5 * 60_000,
  });

  if (carId && isPending) return { title: fallback, dir: undefined, loading: true };
  if (!data) return { title: fallback, dir: undefined, loading: false };
  const resolved = resolveCarTitle(data, locale);
  return {
    title: resolved?.text ?? `${fmt.number(data.year, { useGrouping: false })} ${data.make} ${data.model}`,
    dir: resolved?.locale === "ar" ? ("rtl" as const) : undefined,
    loading: false,
  };
}
