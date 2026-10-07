"use client";

import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CarFormValues, CarStep } from "@/hooks/use-car-form";
import { draftStore } from "@/lib/utils/draft-store";

/** What a draft holds: the form, where the dealer was, and what the AI filled. */
export type CarDraft = {
  version: 1;
  savedAt: number;
  values: Partial<CarFormValues>;
  /** Fields the dealer changed: restored as changed, so the save still translates them. */
  dirty: (keyof CarFormValues)[];
  step: CarStep;
  reached: number;
  aiFilled: (keyof CarFormValues)[];
  aiYears: { from: number; to: number } | null;
};

/** A draft older than this is left behind rather than restored. */
const MAX_AGE_MS = 7 * 86_400_000;
const SAVE_AFTER_MS = 300;

/**
 * Keeps a new car's form in the browser while it is being filled in, so a
 * refresh — or a closed tab — picks up where the dealer left off: the
 * photos, every field, the step, the AI's marks. Read once on arrival, then
 * written a moment after every change; cleared when the car is saved or the
 * dealer starts over. See lib/utils/draft-store for where it lives.
 *
 * Saving waits until the read has finished: otherwise the empty form on
 * arrival would be written over the draft before it could be restored.
 */
export function useCarDraft({
  enabled,
  storageKey,
  form,
  step,
  reached,
  aiFilled,
  aiYears,
  onRestore,
}: {
  enabled: boolean;
  storageKey: string;
  form: UseFormReturn<CarFormValues>;
  step: CarStep;
  reached: number;
  aiFilled: ReadonlySet<keyof CarFormValues>;
  aiYears: { from: number; to: number } | null;
  onRestore: (draft: CarDraft) => void;
}) {
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [ready, setReady] = useState(!enabled);
  // Once the car is saved or the draft discarded, nothing may write it back.
  const closed = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    draftStore.get<CarDraft>(storageKey).then((draft) => {
      if (cancelled) return;
      if (draft?.version === 1 && Date.now() - draft.savedAt < MAX_AGE_MS) {
        for (const [field, value] of Object.entries(draft.values)) {
          form.setValue(field as keyof CarFormValues, value as never, { shouldDirty: draft.dirty.includes(field as keyof CarFormValues) });
        }
        onRestore(draft);
        setRestoredAt(draft.savedAt);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // Read once, on arrival. The callbacks change identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const persist = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (closed.current) return;
        const values = form.getValues();
        const touched = Object.keys(form.formState.dirtyFields) as (keyof CarFormValues)[];
        if (touched.length === 0 && (values.images?.length ?? 0) === 0) {
          void draftStore.remove(storageKey);
          return;
        }
        const draft: CarDraft = {
          version: 1,
          savedAt: Date.now(),
          values,
          dirty: touched,
          step,
          reached,
          aiFilled: [...aiFilled],
          aiYears,
        };
        void draftStore.set(storageKey, draft);
      }, SAVE_AFTER_MS);
    };
    persist();
    const subscription = form.watch(() => persist());
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [enabled, ready, storageKey, form, step, reached, aiFilled, aiYears]);

  return {
    restoredAt,
    /** The car is saved: the draft has done its job. */
    clear: async () => {
      closed.current = true;
      await draftStore.remove(storageKey);
    },
    /** Start over: the draft goes, and saving resumes for the fresh form. */
    discard: async () => {
      await draftStore.remove(storageKey);
      setRestoredAt(null);
    },
  };
}
