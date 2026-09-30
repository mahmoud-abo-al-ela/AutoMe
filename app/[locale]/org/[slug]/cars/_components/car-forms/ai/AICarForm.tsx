import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useCarListingStream,
  CarListingStreamError,
} from "@/hooks/use-car-listing-stream";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { ActionErrorText } from "@/components/ActionErrorText";
import type { ActionError } from "@/lib/utils/error-messages";
import type { CarListingDraft } from "@/lib/services/ai";
import CarFormShared from "../shared/CarFormShared";
import AIUploadSection from "../sections/AIUploadSection";
import { MAX_AI_LISTING_PHOTOS } from "@/lib/constants/car-options";

/** The upload cap the copy quotes, stated once so the two cannot disagree. */
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const AICarForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  // The server's error keeps its shape, so a rate limit can count down.
  const [error, setError] = useState<{ action?: ActionError; text?: string } | null>(null);
  const [carData, setCarData] = useState<CarListingDraft | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const t = useTranslations("org.carForm.ai");
  const { number } = useFormatters();
  const { progress, extract, reset } = useCarListingStream();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);
      setError(null);
      setCarData(null);

      try {
        // Several angles of one car, read together: a rear badge names the
        // model where a front view only shows the shape.
        const files = acceptedFiles.slice(0, MAX_AI_LISTING_PHOTOS);
        if (acceptedFiles.length > files.length) {
          toast.info(t("firstPhotosOnly", { count: number(MAX_AI_LISTING_PHOTOS) }));
        }
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        for (const file of files) {
          if (!validTypes.includes(file.type)) {
            throw new Error(t("invalidType"));
          }
          if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error(t("tooLarge", { size: number(MAX_UPLOAD_MB) }));
          }
        }

        setUploadedImages(files);
        // No allowance is spent yet: a car counts when it is saved.
        const draft = await extract(files);

        setCarData(draft);
        setShowForm(true);
        toast.success(t("extracted"));
      } catch (err) {
        setError(
          err instanceof CarListingStreamError
            ? { action: err.error, text: t("processFailed") }
            : { text: err instanceof Error ? err.message : t("unexpected") }
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [t, number, extract],
  );

  const { isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    // No maxFiles: over it, react-dropzone rejects every file. onDrop keeps
    // the first MAX_AI_LISTING_PHOTOS and says so.
    multiple: true,
    disabled: isProcessing,
  });

  const handleStartOver = () => {
    reset();
    setShowForm(false);
    setCarData(null);
    setUploadedImages([]);
    setError(null);
  };

  // The extraction is schema-validated server-side: numerics arrive as numbers,
  // and bodyType/fuelType/transmission are constrained to the car-options
  // allowlists by the response schema itself. The old widened types and the
  // "Sport Utility Vehicle (SUV)" fix-up are gone because the model can no
  // longer return either.
  const initialData = carData
    ? {
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        bodyType: carData.bodyType,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        color: carData.color,
        seats: carData.seats,
        features: carData.features,
        description: carData.description,
        // The Arabic half of what the model wrote. Without these the
        // extraction is discarded on the way into the form, and the bilingual
        // listing silently becomes an English-only one.
        //
        // There is no `titleEn` here on purpose: the form auto-generates
        // `title` from make/model/year and mirrors it into `titleEn` on submit,
        // so passing the model's richer English headline would only be
        // overwritten. That asymmetry — a fuller Arabic title than English one —
        // is a product call about the auto-generation, not this feature's.
        titleAr: carData.titleAr,
        descriptionAr: carData.descriptionAr,
        featuresAr: carData.featuresAr,
        // Every photo the AI read goes into the listing, in the order dropped.
        images: uploadedImages,
      }
    : {};

  return (
    <div className="w-full mx-auto px-0 sm:px-6">
      {!showForm ? (
        <AIUploadSection
          onDrop={onDrop}
          isProcessing={isProcessing}
          error={error && <ActionErrorText error={error.action} fallback={error.text} />}
          isDragActive={isDragActive}
          progress={progress}
        />
      ) : (
        <CarFormShared
          initialData={initialData}
          isAIMode={true}
          onStartOver={handleStartOver}
          aiConfidence={carData?.confidence}
          uploadedImage={uploadedImages[0] ?? null}
          aiYears={carData ? { from: carData.yearFrom, to: carData.yearTo } : null}
        />
      )}
    </div>
  );
};

export default AICarForm;
