"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCarPlanLimits, getMaxImagesPerCar } from "@/actions/cars";
import { ActionErrorText } from "@/components/ActionErrorText";
import { useCarForm, CAR_STEPS, type CarFormInitialData, type CarFormValues, type CarStep } from "@/hooks/use-car-form";
import { CarListingStreamError, useCarListingStream } from "@/hooks/use-car-listing-stream";
import { useFormatters } from "@/hooks/use-formatters";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import { UNSET } from "@/lib/utils/car-disclosures";
import type { ActionError } from "@/lib/utils/error-messages";
import { cn } from "@/lib/utils";
import { StepHeading, StepRail } from "./StepRail";
import { PhotosStep, type AiOffer } from "./PhotosStep";
import { CarStep as CarDetailsStep } from "./CarStep";
import { HistoryStep } from "./HistoryStep";
import { PublishStep } from "./PublishStep";
import { useCarDraft } from "./use-car-draft";

/** The fields a photo reading fills in, and so may carry the AI mark. */
const AI_FIELDS = [
  "make", "model", "year", "price", "mileage", "bodyType", "fuelType", "transmission", "color", "seats",
  "features", "featuresAr", "description", "descriptionAr", "titleAr",
] as const satisfies readonly (keyof CarFormValues)[];

const NO_DATA: CarFormInitialData = {};

/**
 * Adding or editing a car (canvas: Car editor — round 1, B · Guided steps):
 * four steps down a rail — photos, the car, its history, then price and
 * publish — one on screen at a time. Adding moves forward a step at a time
 * and publishes (or saves hidden) at the end; editing opens on the first step
 * with every step open and "Save changes" on each.
 *
 * When adding on a plan that reads photos, the first step offers to read the
 * details; what the AI fills carries its mark until the dealer changes it.
 */
export function CarEditor({
  mode,
  carId = null,
  initialData = NO_DATA,
  title,
  aside,
}: {
  mode: "add" | "edit";
  carId?: string | null;
  initialData?: CarFormInitialData;
  /** The page's heading: "Add a car", or the car's name with its status. */
  title: ReactNode;
  /** Under the heading when editing: the car's links. */
  aside?: ReactNode;
}) {
  const t = useTranslations("org.carForm.editor");
  const tAi = useTranslations("org.carForm.ai");
  const fmt = useFormatters();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = mode === "edit";

  const [maxImages, setMaxImages] = useState<number>(VALIDATION_RULES.CAR.MAX_IMAGES);
  useEffect(() => {
    getMaxImagesPerCar()
      .then((result) => result?.success && result.data?.maxImagesPerCar && setMaxImages(result.data.maxImagesPerCar))
      .catch(() => undefined);
  }, []);

  const { form, currentStep, reached, loading, handlers } = useCarForm(initialData, maxImages, isEdit, carId);
  const { watch, setValue, formState } = form;

  // A new step starts at the top, with focus on its heading so a keyboard or
  // screen-reader user lands there too. Not on first load: the page opens at
  // the top already. A jump instead of a glide when motion is reduced.
  const shownStep = useRef(currentStep);
  useEffect(() => {
    if (shownStep.current === currentStep) return;
    shownStep.current = currentStep;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("step-title")?.focus({ preventScroll: true });
  }, [currentStep]);

  // ── Reading the details from the photos (adding only) ─────────────────
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
      await handlers.handleNext();
    } catch (error) {
      setReadError(error instanceof CarListingStreamError ? { action: error.error, text: tAi("processFailed") } : { text: tAi("unexpected") });
    } finally {
      setReading(false);
    }
  };

  /** The AI's mark stays until the dealer edits the field. */
  const isAi = (field: keyof CarFormValues) => aiFilled.has(field) && !formState.dirtyFields[field];

  // ── A new car is kept in the browser as it is filled in (use-car-draft) ─
  const draft = useCarDraft({
    enabled: !isEdit,
    storageKey: `car-draft:${slug}:new`,
    form,
    step: currentStep,
    reached,
    aiFilled,
    aiYears,
    onRestore: (saved) => {
      handlers.resume(saved.step, saved.reached);
      setAiFilled(new Set(saved.aiFilled));
      setAiYears(saved.aiYears);
    },
  });
  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const startOver = async () => {
    await draft.discard();
    form.reset();
    setAiFilled(new Set());
    setAiYears(null);
    setReadError(null);
    handlers.resume("photos", 0);
  };

  // ── Leaving an edit with unsaved changes asks first (the browser's own
  // prompt). A new car needs no prompt: its draft survives the page. ───────
  const unsaved = isEdit && formState.isDirty && !formState.isSubmitSuccessful;
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const save = (status?: CarFormValues["status"]) => {
    if (status) setValue("status", status);
    return form.handleSubmit(async (data) => {
      if (await handlers.onSubmit(data)) await draft.clear();
    }, handlers.onInvalid)();
  };

  // ── What the rail says under each step ──────────────────────────────────
  const photos = watch("images") ?? [];
  const [make, model, year, mileage, price] = watch(["make", "model", "year", "mileage", "price"]);
  const answered = (["originalPaint", "accidentFree", "ownerCount", "serviceHistory"] as const).filter(
    (field) => (watch(field) ?? UNSET) !== UNSET,
  ).length + (watch("licenseValidUntil") ? 1 : 0);
  const summaries: Partial<Record<CarStep, string>> = {
    photos: t("summaries.photos", { count: photos.length, value: fmt.number(photos.length) }),
    car: make && model ? [make, model, year ? fmt.number(Number(year), { useGrouping: false }) : ""].join(" ").trim() + (Number(mileage) > 0 ? `, ${fmt.mileage(Number(mileage))}` : "") : undefined,
    history: t("summaries.history", { count: answered, value: fmt.number(answered) }),
    publish: Number(price) > 0 ? fmt.price(Number(price)) : undefined,
  };

  const index = CAR_STEPS.indexOf(currentStep);
  const last = index === CAR_STEPS.length - 1;
  const carName = [make, model].filter(Boolean).join(" ");

  return (
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10"
    >
      <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-2">
          {title}
          {aside}
        </div>
        <div className="hidden lg:block">
          <StepRail current={currentStep} reached={reached} summaries={summaries} complete={isEdit} onGo={handlers.goTo} />
        </div>
        <p className="hidden rounded-control border border-border bg-card p-3.5 text-caption text-muted-foreground lg:block">
          {isEdit ? t("noteEdit") : t("noteAdd")}
        </p>
      </aside>

      <section aria-labelledby="step-title" className="flex flex-col gap-6 rounded-sheet border border-border bg-card p-5 sm:p-8">
        {draft.restoredAt && (
          <div role="status" className="-mx-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-control bg-muted/70 px-4 py-2.5 text-caption">
            <span className="flex items-center gap-2">
              <History aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              {t("draft.restored", { time: fmt.relativeToNow(draft.restoredAt, { addSuffix: true }) })}
            </span>
            <button
              type="button"
              onClick={() => setConfirmingStartOver(true)}
              className="h-9 cursor-pointer font-semibold text-[#1d4e9e] hover:underline"
            >
              {t("draft.startOver")}
            </button>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <StepHeading current={currentStep} />
          <p className="max-w-[64ch] text-body text-muted-foreground">
            {t(`leads.${currentStep}`, { count: fmt.number(maxImages) })}
          </p>
        </div>

        {currentStep === "car" && aiFilled.size > 0 && (
          <p className="rounded-control bg-[#e7eef8] px-4 py-3 text-caption">
            {t("ai.done", { car: carName })}
            {aiYears && (
              <span className="mt-1 block font-semibold text-[#8a5e00]">
                {t("ai.years", {
                  from: fmt.number(aiYears.from, { useGrouping: false }),
                  to: fmt.number(aiYears.to, { useGrouping: false }),
                })}
              </span>
            )}
          </p>
        )}

        {currentStep === "photos" && (
          <PhotosStep
            photos={photos}
            onChange={(next) => setValue("images", next, { shouldValidate: formState.isSubmitted || !!formState.errors.images, shouldDirty: true })}
            maxImages={maxImages}
            error={formState.errors.images?.message}
            ai={aiOffer}
            reading={{
              busy: reading,
              progress: reading ? progress : null,
              error: readError && <ActionErrorText error={readError.action} fallback={readError.text} />,
              onRead: readPhotos,
            }}
          />
        )}
        {currentStep === "car" && <CarDetailsStep form={form} isAi={isAi} />}
        {currentStep === "history" && <HistoryStep form={form} />}
        {currentStep === "publish" && <PublishStep form={form} isAi={isAi} isEditMode={isEdit} carId={carId} />}

        <div
          className={cn(
            // On a phone the bar stays in reach at the foot of the screen, its buttons a size down so they share one row.
            "sticky bottom-0 -mx-5 -mb-5 flex items-center gap-2 border-t border-border bg-card px-5 py-3 sm:flex-wrap sm:gap-3",
            "[&_[data-compact]]:max-sm:h-11 [&_[data-compact]]:max-sm:px-4 [&_[data-compact]]:max-sm:text-caption",
            "sm:static sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:pt-6",
          )}
        >
          {index > 0 && (
            <Button type="button" variant="outline-strong" size="control" className="h-11 border bg-field sm:h-12" onClick={handlers.handlePrevious} disabled={loading}>
              {t("back")}
            </Button>
          )}
          <span className="flex-1" />
          {currentStep === "history" && !isEdit && (
            <button type="button" onClick={handlers.handleNext} className="h-12 cursor-pointer px-2 text-caption font-semibold text-[#1d4e9e] hover:underline">
              {t("skip")}
            </button>
          )}
          {!last && (
            <Button
              type="button"
              variant={isEdit ? "outline-strong" : "marker"}
              size="xl" data-compact
              className={cn(isEdit && "border bg-field")}
              onClick={handlers.handleNext}
              disabled={reading || loading}
            >
              {t("continue")}
            </Button>
          )}
          {last && !isEdit && (
            <Button type="button" variant="outline-strong" size="xl" data-compact className="border bg-field" onClick={() => save("Unavailable")} disabled={loading}>
              {t("saveHidden")}
            </Button>
          )}
          {(isEdit || last) && (
            <Button type="button" variant="marker" size="xl" data-compact onClick={() => save(isEdit ? undefined : "Available")} disabled={loading || reading}>
              {loading && <Loader2 aria-hidden className="animate-spin" />}
              {loading ? t("saving") : isEdit ? t("saveChanges") : t("publish")}
            </Button>
          )}
        </div>
      </section>

      <AlertDialog open={confirmingStartOver} onOpenChange={setConfirmingStartOver}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("draft.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("draft.confirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("draft.keep")}</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={startOver}>
              {t("draft.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
