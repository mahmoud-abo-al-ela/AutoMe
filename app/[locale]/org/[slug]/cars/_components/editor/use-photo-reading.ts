import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { getCarPlanLimits } from "@/actions/cars";
import type { CarFormValues } from "@/hooks/use-car-form";
import { CarListingStreamError, useCarListingStream } from "@/hooks/use-car-listing-stream";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";
import type { ActionError } from "@/lib/utils/error-messages";
import type { AiOffer } from "./PhotosStep";

/** The fields a photo reading fills in, and so may carry the AI mark. */
const AI_FIELDS = [
  "make", "model", "year", "price", "mileage", "bodyType", "fuelType", "transmission", "color", "seats",
  "features", "featuresAr", "description", "descriptionAr", "titleAr",
] as const satisfies readonly (keyof CarFormValues)[];

/**
 * Reading a new car's details from its photos: whether the plan offers it,
 * the reading itself, and which fields carry the AI's mark. Adding only —
 * when editing, the offer is always none. `onRead` runs after a reading
 * fills the form (the editor moves on to the next step).
 */
export function usePhotoReading({
  form,
  isEdit,
  slug,
  onRead,
}: {
  form: UseFormReturn<CarFormValues>;
  isEdit: boolean;
  slug: string;
  onRead: () => Promise<unknown>;
}) {
  const tAi = useTranslations("org.carForm.ai");
  const { watch, setValue, formState } = form;
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(isEdit ? false : null);
  useEffect(() => {
    if (isEdit) return;
    getCarPlanLimits()
      .then((result) => setAiEnabled(result?.success ? (result.data?.aiProcessingEnabled ?? false) : false))
      .catch(() => setAiEnabled(false));
  }, [isEdit]);
  const { usage } = usePlanUsage("aiProcessing");
  const limited = !!usage && usage.limit !== -1;
  const remaining = limited ? Math.max(0, usage.limit - usage.current) : null;
  const aiOffer: AiOffer =
    isEdit || aiEnabled === null
      ? { kind: "none" }
      : !aiEnabled
        ? { kind: "locked", billingHref: `/org/${slug}/billing` }
        : remaining === 0
          ? { kind: "exhausted" }
          : { kind: "ready", remaining, limit: usage && usage.limit !== -1 ? usage.limit : null };

  const { progress, extract } = useCarListingStream();
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<{ action?: ActionError; text?: string } | null>(null);
  const [aiFilled, setAiFilled] = useState<ReadonlySet<keyof CarFormValues>>(new Set());
  const [aiYears, setAiYears] = useState<{ from: number; to: number } | null>(null);

  const readPhotos = async () => {
    const files = (watch("images") ?? []).filter((photo): photo is File => photo instanceof File).slice(0, MAX_AI_LISTING_PHOTOS);
    if (files.length === 0) return;
    setReading(true);
    setReadError(null);
    try {
      const draft = await extract(files);
      const filled = new Set<keyof CarFormValues>();
      for (const field of AI_FIELDS) {
        const value = draft[field as keyof typeof draft];
        if (value === undefined || value === null || value === "") continue;
        // Not marked dirty: the draft already carries both languages, so there is nothing to translate on save.
        setValue(field, value as never);
        filled.add(field);
      }
      setAiFilled(filled);
      setAiYears(draft.yearFrom !== draft.yearTo ? { from: draft.yearFrom, to: draft.yearTo } : null);
      toast.success(tAi("extracted"));
      await onRead();
    } catch (error) {
      setReadError(error instanceof CarListingStreamError ? { action: error.error, text: tAi("processFailed") } : { text: tAi("unexpected") });
    } finally {
      setReading(false);
    }
  };

  /** The AI's mark stays until the dealer edits the field. */
  const isAi = (field: keyof CarFormValues) => aiFilled.has(field) && !formState.dirtyFields[field];

  return {
    aiOffer,
    progress,
    reading,
    readError,
    setReadError,
    aiFilled,
    setAiFilled,
    aiYears,
    setAiYears,
    readPhotos,
    isAi,
  };
}
