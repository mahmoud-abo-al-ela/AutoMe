"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import type { CarListingProgress } from "@/hooks/use-car-listing-stream";
import type { CarFormValues } from "@/hooks/use-car-form";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";
import { cn } from "@/lib/utils";

const MAX_IMAGE_MB = 5;

type Photo = CarFormValues["images"][number];

/** What the AI can do here: nothing to offer (editing), not on the plan, used up, or ready. */
export type AiOffer =
  | { kind: "none" }
  | { kind: "locked"; billingHref: string }
  | { kind: "exhausted" }
  | { kind: "ready"; remaining: number | null; limit: number | null };

export type AiReading = {
  busy: boolean;
  progress: CarListingProgress | null;
  error: ReactNode;
  onRead: () => void;
};

/**
 * Step 1: the photos — the cover first, the rest in the order buyers swipe
 * them. Each can be moved, made the cover or removed with a visible button,
 * so the order never depends on dragging. When adding a car on a plan that
 * reads photos, the offer to read the details sits right under them.
 */
export function PhotosStep({
  photos,
  onChange,
  maxImages,
  error,
  ai,
  reading,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  maxImages: number;
  error?: string;
  ai: AiOffer;
  reading: AiReading;
}) {
  const t = useTranslations("org.carForm");
  const fmt = useFormatters();
  const full = photos.length >= maxImages;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: MAX_IMAGE_MB * 1024 * 1024,
    disabled: full || reading.busy,
    onDrop: (accepted) => {
      if (accepted.length === 0) return;
      const next = [...photos, ...accepted];
      if (next.length > maxImages) toast.info(t("images.tooMany", { count: fmt.number(maxImages) }));
      onChange(next.slice(0, maxImages));
    },
    onDropRejected: () => toast.error(t("images.failed")),
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo, index) => (
          <PhotoTile
            key={typeof photo === "string" ? photo : `${photo.name}-${photo.size}-${photo.lastModified}`}
            photo={photo}
            index={index}
            count={photos.length}
            onMove={(to) => move(index, to)}
            onRemove={() => onChange(photos.filter((_, i) => i !== index))}
          />
        ))}
        {!full && (
          <li className={cn(photos.length === 0 && "col-span-full")}>
            <div
              {...getRootProps()}
              className={cn(
                "flex h-full min-h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed bg-field p-4 text-center transition-colors",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isDragActive ? "border-[#1d4e9e] bg-[#e7eef8]" : error ? "border-destructive" : "border-[#8c8170] hover:bg-muted",
              )}
            >
              <input {...getInputProps()} aria-label={t("editor.photos.add")} />
              <ImagePlus aria-hidden className="size-6" />
              <span className="text-body font-semibold">{isDragActive ? t("editor.photos.dropping") : t("editor.photos.add")}</span>
              <span className="text-micro text-muted-foreground">{t("editor.photos.dropHere")}</span>
              <span className="text-micro text-muted-foreground">{t("editor.photos.limits", { size: fmt.number(MAX_IMAGE_MB) })}</span>
            </div>
          </li>
        )}
      </ul>

      {full && <p className="text-caption text-muted-foreground">{t("editor.photos.full")}</p>}
      {error && (
        <p role="alert" className="text-caption font-semibold text-destructive">
          {error}
        </p>
      )}

      <AiPanel ai={ai} reading={reading} hasPhotos={photos.length > 0} />
    </div>
  );
}

function PhotoTile({
  photo,
  index,
  count,
  onMove,
  onRemove,
}: {
  photo: Photo;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("org.carForm.editor.photos");
  const fmt = useFormatters();
  const n = fmt.number(index + 1);
  // A dropped file shows from a blob URL, made and released by the same
  // effect: made in render and released in an effect, React's development
  // double-mount released it while the tile still showed it, and the photo
  // broke.
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (typeof photo === "string") return;
    const url = URL.createObjectURL(photo);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const src = typeof photo === "string" ? photo : blobUrl;

  const iconButton =
    "flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <li className="relative aspect-[4/3] overflow-hidden rounded-control border border-border bg-muted">
      {src && <Image src={src} alt={t("alt", { index: n })} fill unoptimized sizes="240px" className="object-cover" />}
      {index === 0 && (
        <span className="absolute start-2 top-2 rounded-full bg-inverse px-2.5 py-0.5 text-micro font-semibold text-inverse-foreground">{t("cover")}</span>
      )}
      <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
        <span className="flex gap-1">
          <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={t("moveEarlier", { index: n })}>
            <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
          </button>
          <button type="button" className={iconButton} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={t("moveLater", { index: n })}>
            <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
          </button>
        </span>
        <span className="flex gap-1">
          {index > 0 && (
            // Not on a narrow phone tile, where it does not fit: moving it earlier gets there too.
            <button type="button" className={cn(iconButton, "hidden w-auto px-3 text-micro font-semibold sm:flex")} onClick={() => onMove(0)} aria-label={t("makeCover", { index: n })}>
              {t("cover")}
            </button>
          )}
          <button type="button" className={iconButton} onClick={onRemove} aria-label={t("remove", { index: n })}>
            <X aria-hidden className="size-4" />
          </button>
        </span>
      </span>
    </li>
  );
}

/**
 * The offer to read the details from the photos. Its progress is real: bytes
 * sent, then fields written; the model's queue in between holds the bar and
 * says it is waiting rather than inventing a percentage.
 */
function AiPanel({ ai, reading, hasPhotos }: { ai: AiOffer; reading: AiReading; hasPhotos: boolean }) {
  const t = useTranslations("org.carForm");
  const fmt = useFormatters();
  if (ai.kind === "none") return null;

  if (ai.kind !== "ready") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-muted/50 px-4 py-3 text-caption">
        <span className="flex items-center gap-2">
          <Sparkles aria-hidden className="size-4 text-muted-foreground" />
          {ai.kind === "locked" ? t("editor.ai.locked") : t("editor.ai.exhausted")}
        </span>
        {ai.kind === "locked" && (
          <Link href={ai.billingHref} className="font-semibold text-[#1d4e9e] hover:underline">
            {t("editor.ai.upgrade")}
          </Link>
        )}
      </div>
    );
  }

  const progress = reading.progress;
  const fraction = !progress
    ? 0
    : progress.phase === "done"
      ? 1
      : progress.phase === "writing" && progress.fieldsTotal > 0
        ? 0.1 + 0.9 * (progress.fieldsDone / progress.fieldsTotal)
        : 0.1 * progress.uploaded;
  const stage = !progress
    ? t("editor.ai.reading")
    : progress.phase === "uploading"
      ? t("ai.stageUploading", { percent: fmt.number(progress.uploaded, { style: "percent" }) })
      : progress.phase === "writing"
        ? t("ai.stageWriting", { done: fmt.number(progress.fieldsDone), total: fmt.number(progress.fieldsTotal) })
        : progress.phase === "done"
          ? t("ai.stageDone")
          : t("ai.stageWaiting");

  return (
    <section aria-labelledby="ai-read-title" className="flex flex-col gap-3 rounded-control bg-[#e7eef8] px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-[60ch] gap-3">
          <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-[#1d4e9e]" />
          <div>
            <h3 id="ai-read-title" className="text-body font-semibold">
              {t("editor.ai.title")}
            </h3>
            <p className="text-caption text-foreground/80">{t("editor.ai.body", { count: fmt.number(MAX_AI_LISTING_PHOTOS) })}</p>
            {ai.limit !== null && ai.remaining !== null && (
              <p className="mt-1 text-micro text-muted-foreground">
                {t("editor.ai.remaining", { remaining: fmt.number(ai.remaining), limit: fmt.number(ai.limit) })}
              </p>
            )}
          </div>
        </div>
        <Button variant="inverse" size="control" className="h-11" disabled={!hasPhotos || reading.busy} onClick={reading.onRead}>
          {reading.busy ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}
          {reading.busy ? t("editor.ai.reading") : t("editor.ai.read")}
        </Button>
      </div>

      {reading.busy && (
        <div className="flex flex-col gap-1.5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            aria-valuetext={stage}
            className="h-1.5 overflow-hidden rounded-full bg-white"
          >
            <div
              className={cn("h-full rounded-full bg-[#1d4e9e] transition-[width] duration-300", progress?.phase === "waiting" && "animate-pulse")}
              style={{ width: `${Math.max(0.04, fraction) * 100}%` }}
            />
          </div>
          <p aria-live="polite" className="text-micro font-semibold">
            {stage}
          </p>
          {progress?.phase === "waiting" && <p className="text-micro text-muted-foreground">{t("ai.stageWaitingNote")}</p>}
        </div>
      )}
      {reading.error && (
        <p role="alert" className="text-caption font-semibold text-destructive">
          {reading.error}
        </p>
      )}
    </section>
  );
}
