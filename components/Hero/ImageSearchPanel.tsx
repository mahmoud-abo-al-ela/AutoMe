"use client";

import { useTranslations } from "next-intl";
import { Camera, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

/**
 * The expanded "search by photo" panel: preview, an analyzing overlay while the
 * AI runs, and the cancel / change / search controls. Pure presenter — all state
 * and handlers come from useImageSearch.
 */
const ImageSearchPanel = ({
  imagePreview,
  fileName,
  loading,
  changeImageRef,
  onFileInputChange,
  onCancel,
  onChangeImage,
  onSearch,
}: {
  imagePreview?: string | null;
  fileName?: string | null;
  loading?: boolean;
  changeImageRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onChangeImage: () => void;
  onSearch: () => void;
}) => {
  const t = useTranslations("home.hero");
  const tActions = useTranslations("common.actions");
  return (
    <div className="w-full max-w-[600px] overflow-hidden rounded-control border-[3px] border-marker bg-field text-foreground motion-safe:animate-in motion-safe:fade-in">
      <div className="flex items-center justify-between gap-3 bg-plate-band py-1 ps-3 pe-1">
        <p className="flex items-center gap-1.5 text-micro font-bold">
          <Camera aria-hidden className="size-4" />
          {t("searchByPhoto")}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("closePhotoSearch")}
          title={t("closePhotoSearch")}
          onClick={onCancel}
          disabled={loading}
          className="size-8 rounded-plate hover:bg-field/60"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="relative h-36 w-full overflow-hidden rounded-plate bg-muted sm:h-44">
          {imagePreview && (
            <Image
              src={imagePreview}
              alt={t("selectedCarAlt")}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain"
              priority
            />
          )}
          {loading && (
            <div
              role="status"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-inverse/70 text-inverse-foreground"
            >
              <Loader2 aria-hidden className="size-6 motion-safe:animate-spin" />
              <span className="text-caption font-medium">{t("analyzingImage")}</span>
            </div>
          )}
        </div>

        {fileName && <p className="truncate text-micro text-muted-foreground">{fileName}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="xl" onClick={onCancel} disabled={loading}>
            {tActions("cancel")}
          </Button>
          <Button type="button" variant="outline-strong" size="xl" onClick={onChangeImage} disabled={loading}>
            <Upload />
            {t("changeImage")}
          </Button>
          <Button type="button" variant="marker" size="xl" onClick={onSearch} disabled={loading} className="ms-auto">
            {loading ? (
              <>
                <Loader2 className="motion-safe:animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              t("searchWithImage")
            )}
          </Button>
        </div>

        <input ref={changeImageRef} type="file" accept="image/*" className="hidden" onChange={onFileInputChange} />
      </div>
    </div>
  );
};

export default ImageSearchPanel;
