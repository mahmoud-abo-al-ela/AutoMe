"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addCar, updateCar } from "@/actions/cars";
import { useCarListingStream } from "@/hooks/use-car-listing-stream";
import { queryKeys } from "@/lib/query-client";
import { shrinkForAi, THUMBNAIL_EDGE } from "@/lib/utils/shrink-image";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";
import type { ActionError } from "@/lib/utils/error-messages";
import type { CarListingDraft, PhotoGroup } from "@/lib/services/ai";

/** A car in the batch, as the dealer arranges it. Photos index `files`. */
export interface ImportGroup extends PhotoGroup {
  id: number;
}

export type DraftStatus = "waiting" | "reading" | "saving" | "done" | "failed" | "skipped";

export interface DraftResult {
  status: DraftStatus;
  carId?: string;
  title?: string;
  /** The server's error, for useActionError; absent for a skip. */
  error?: ActionError;
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
  const nextId = useRef(0);
  const stopped = useRef(false);

  const withIds = (found: PhotoGroup[]) => found.map((g) => ({ ...g, id: nextId.current++ }));

  /** Sort the photos into cars. Throws ImportError for the page to show. */
  const group = useCallback(async (picked: File[]) => {
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
      setGroups(withIds(json.data.groups));
      setStage("review");
    } catch (error) {
      setStage("pick");
      throw error instanceof ImportError ? error : new ImportError(undefined);
    }
  }, []);

  /** Move one photo to another car, or to a car of its own (`to` null). */
  const movePhoto = useCallback((photo: number, to: number | null) => {
    setGroups((all) => {
      const without = all
        .map((g) => {
          if (!g.photos.includes(photo)) return g;
          const photos = g.photos.filter((p) => p !== photo);
          const readWith = g.readWith.filter((p) => p !== photo);
          return { ...g, photos, readWith: readWith.length > 0 ? readWith : photos.slice(0, MAX_AI_LISTING_PHOTOS) };
        })
        .filter((g) => g.photos.length > 0);
      if (to === null) {
        return [...without, { id: nextId.current++, label: "", photos: [photo], readWith: [photo] }];
      }
      return without.map((g) =>
        g.id === to
          ? {
              ...g,
              photos: [...g.photos, photo],
              readWith: g.readWith.length < MAX_AI_LISTING_PHOTOS ? [...g.readWith, photo] : g.readWith,
            }
          : g
      );
    });
  }, []);

  /** Leave a car out of the import. */
  const removeGroup = useCallback((id: number) => {
    setGroups((all) => all.filter((g) => g.id !== id));
  }, []);

  const settle = (id: number, patch: DraftResult) => setResults((all) => ({ ...all, [id]: patch }));

  /**
   * Read and save each car, up to `room` of them — the fewer of the cars and
   * the AI listings the plan has left. The rest are skipped, not attempted:
   * the server would refuse them anyway, after a wasted read.
   */
  const createDrafts = useCallback(
    async (room: number, maxImages: number) => {
      stopped.current = false;
      setStage("creating");
      setResults(Object.fromEntries(groups.map((g, i) => [g.id, { status: i < room ? "waiting" : "skipped" }])));

      for (const [index, g] of groups.entries()) {
        if (index >= room || stopped.current) {
          settle(g.id, { status: "skipped" });
          continue;
        }
        try {
          settle(g.id, { status: "reading" });
          const draft = await extract(g.readWith.map((i) => files[i]));

          settle(g.id, { status: "saving" });
          // The identifying photos first — the front shot usually among
          // them — then the rest, up to the plan's photos per car.
          const order = [...g.readWith, ...g.photos.filter((p) => !g.readWith.includes(p))];
          const images = await Promise.all(order.slice(0, maxImages).map((i) => shrinkForAi(files[i])));
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
    [groups, files, extract, queryClient]
  );

  /** Stop after the car being read now. */
  const stop = useCallback(() => {
    stopped.current = true;
  }, []);

  /** Make every draft this import saved visible in the marketplace. */
  const publishAll = useCallback(async () => {
    const ids = Object.values(results).flatMap((r) => (r.status === "done" && r.carId ? [r.carId] : []));
    const outcomes = await Promise.all(ids.map((id) => updateCar(id, { status: "AVAILABLE" })));
    queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    return { published: outcomes.filter((o) => o?.success).length, total: ids.length };
  }, [results, queryClient]);

  const reset = useCallback(() => {
    setFiles([]);
    setGroups([]);
    setResults({});
    setStage("pick");
  }, []);

  return { files, stage, groups, results, progress, group, movePhoto, removeGroup, createDrafts, stop, publishAll, reset };
}
