"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addCar, updateCar } from "@/actions/cars";
import { useCarListingStream } from "@/hooks/use-car-listing-stream";
import { queryKeys } from "@/lib/query-client";
import { shrinkForAi, THUMBNAIL_EDGE } from "@/lib/utils/shrink-image";
import { placePhoto, type ImportGroup } from "@/lib/utils/photo-groups";
import type { ActionError } from "@/lib/utils/error-messages";
import type { CarListingDraft, PhotoGroup } from "@/lib/services/ai";

export type { ImportGroup };

export type DraftStatus = "waiting" | "reading" | "saving" | "done" | "failed" | "skipped";

export interface DraftResult {
  status: DraftStatus;
  carId?: string;
  title?: string;
  /** The server's error, for useActionError; absent for a skip. */
  error?: ActionError;
  /** Made visible to buyers from the import (publishAll). */
  published?: boolean;
}

export type ImportStage = "pick" | "grouping" | "review" | "creating" | "done";

/** A failed step, carrying the server's error for useActionError. */
export class ImportError extends Error {
  constructor(readonly error: ActionError | undefined) {
    super(error?.message ?? "Import step failed");
  }
}

const GROUP_ENDPOINT = "/api/ai/car-photos";

/** What addCar takes, from what the photo read wrote. */
function carFromDraft(draft: CarListingDraft, images: File[]) {
  return {
    // The same generated headline the car form writes, mirrored into English.
    title: `${draft.make} ${draft.model} ${draft.year}`,
    titleEn: `${draft.make} ${draft.model} ${draft.year}`,
    titleAr: draft.titleAr,
    description: draft.descriptionEn,
    descriptionEn: draft.descriptionEn,
    descriptionAr: draft.descriptionAr,
    features: draft.featuresEn,
    featuresAr: draft.featuresAr,
    make: draft.make,
    model: draft.model,
    year: draft.year,
    price: draft.price,
    mileage: draft.mileage,
    bodyType: draft.bodyType,
    fuelType: draft.fuelType,
    transmission: draft.transmission,
    color: draft.color,
    seats: draft.seats,
    // Hidden until the dealer has reviewed it: the marketplace lists only
    // available cars.
    status: "UNAVAILABLE",
    images,
  };
}

/**
 * A bulk import, start to finish: sort the photos into cars, let the dealer
 * fix the sorting, then read and save each car as a hidden draft.
 *
 * Cars are done one at a time, on purpose. Each save claims the AI calls
 * made since the last one (claimAiUsageForCar), so reading the next car
 * before saving this one would charge both reads to one car.
 */
export function useBulkImport() {
  const queryClient = useQueryClient();
  const { extract, progress } = useCarListingStream();
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<ImportStage>("pick");
  const [groups, setGroups] = useState<ImportGroup[]>([]);
  const [results, setResults] = useState<Record<number, DraftResult>>({});
  /** The cars the dealer chose to draft with AI; the rest are filled in by hand. */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const nextId = useRef(0);
  const stopped = useRef(false);

  const withIds = (found: PhotoGroup[]) => found.map((g) => ({ ...g, id: nextId.current++ }));

  /**
   * Sort the photos into cars, and choose the first `room` of them to draft
   * with AI — the dealer can change which. Throws ImportError for the page.
   */
  const group = useCallback(async (picked: File[], room: number) => {
    setFiles(picked);
    setResults({});
    setStage("grouping");
    try {
      const body = new FormData();
      for (const thumb of await Promise.all(picked.map((f) => shrinkForAi(f, THUMBNAIL_EDGE)))) {
        body.append("file", thumb);
      }
      const response = await fetch(GROUP_ENDPOINT, { method: "POST", body });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new ImportError(json?.error);
      const found = withIds(json.data.groups);
      setGroups(found);
      setSelected(new Set(found.slice(0, room).map((g) => g.id)));
      setStage("review");
    } catch (error) {
      setStage("pick");
      throw error instanceof ImportError ? error : new ImportError(undefined);
    }
  }, []);

  /**
   * Move one photo: to position `at` in car `to` (the end if no position), or
   * to a car of its own (`to` null). Within its own car this reorders — and
   * a car's order is its listing's order, the first photo its cover.
   */
  const movePhoto = useCallback((photo: number, to: number | null, at?: number) => {
    setGroups((all) => placePhoto(all, photo, to, at, () => nextId.current++));
  }, []);

  /** Leave a car out of the import. */
  const removeGroup = useCallback((id: number) => {
    setGroups((all) => all.filter((g) => g.id !== id));
    setSelected((all) => {
      const next = new Set(all);
      next.delete(id);
      return next;
    });
  }, []);

  /** Draft this car with AI, or not. The page keeps the count within the plan. */
  const toggleSelected = useCallback((id: number) => {
    setSelected((all) => {
      const next = new Set(all);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const settle = (id: number, patch: DraftResult) => setResults((all) => ({ ...all, [id]: patch }));

  /**
   * Read and save each car the dealer chose to draft with AI. The others are
   * "skipped" — not attempted, and left for the dealer to fill in by hand
   * (see markSaved) with their photos still here.
   */
  const createDrafts = useCallback(
    async (maxImages: number) => {
      stopped.current = false;
      setStage("creating");
      setResults(Object.fromEntries(groups.map((g) => [g.id, { status: selected.has(g.id) ? "waiting" : "skipped" }])));

      for (const g of groups) {
        if (!selected.has(g.id) || stopped.current) {
          settle(g.id, { status: "skipped" });
          continue;
        }
        try {
          settle(g.id, { status: "reading" });
          const draft = await extract(g.readWith.map((i) => files[i]));

          settle(g.id, { status: "saving" });
          // In the dealer's order — the first is the cover — up to the
          // plan's photos per car.
          const images = await Promise.all(g.photos.slice(0, maxImages).map((i) => shrinkForAi(files[i])));
          const response = await addCar(carFromDraft(draft, images), { editedLocale: null });
          if (!response.success) throw new ImportError(response.error as ActionError);

          settle(g.id, { status: "done", carId: response.data.id, title: `${draft.year} ${draft.make} ${draft.model}` });
        } catch (error) {
          const actionError =
            error instanceof ImportError
              ? error.error
              : ((error as { error?: ActionError })?.error ?? undefined);
          settle(g.id, { status: "failed", error: actionError });
          // A plan limit ends the import: every car after this one would hit it.
          if (actionError?.code === "PLAN_LIMIT_EXCEEDED") stopped.current = true;
        }
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("aiProcessing") });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("cars") });
      setStage("done");
    },
    [groups, selected, files, extract, queryClient]
  );

  /** A car the dealer filled in by hand from the import, now saved. */
  const markSaved = useCallback(
    (id: number, carId: string) => {
      setResults((all) => ({ ...all, [id]: { status: "done", carId } }));
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.planUsage("cars") });
    },
    [queryClient]
  );

  /** Stop after the car being read now. */
  const stop = useCallback(() => {
    stopped.current = true;
  }, []);

  /** Make every draft this import saved visible in the marketplace. */
  const publishAll = useCallback(async () => {
    const drafts = Object.entries(results).filter(([, r]) => r.status === "done" && r.carId && !r.published);
    const outcomes = await Promise.all(drafts.map(([, r]) => updateCar(r.carId!, { status: "AVAILABLE" })));
    // Each row shows what happened to it, not just a count in a toast.
    setResults((all) => {
      const next = { ...all };
      drafts.forEach(([id], i) => {
        if (outcomes[i]?.success) next[Number(id)] = { ...next[Number(id)], published: true };
      });
      return next;
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    return { published: outcomes.filter((o) => o?.success).length, total: drafts.length };
  }, [results, queryClient]);

  const reset = useCallback(() => {
    setFiles([]);
    setGroups([]);
    setResults({});
    setSelected(new Set());
    setStage("pick");
  }, []);

  return {
    files,
    stage,
    groups,
    results,
    selected,
    progress,
    group,
    movePhoto,
    removeGroup,
    toggleSelected,
    createDrafts,
    markSaved,
    stop,
    publishAll,
    reset,
  };
}
