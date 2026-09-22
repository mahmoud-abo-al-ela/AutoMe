import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { processCarImageGated } from "@/actions/cars";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useActionError } from "@/hooks/use-action-error";
import type { CarListingDraft } from "@/lib/services/ai";
import CarFormShared from "../shared/CarFormShared";
import AIUploadSection from "../sections/AIUploadSection";

/** The upload cap the copy quotes, stated once so the two cannot disagree. */
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const AICarForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carData, setCarData] = useState<CarListingDraft | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const t = useTranslations("org.carForm.ai");
  const { number } = useFormatters();
  const actionError = useActionError();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);
      setError(null);
      setCarData(null);

      try {
        const file = acceptedFiles[0];
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          throw new Error(t("invalidType"));
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(t("tooLarge", { size: number(MAX_UPLOAD_MB) }));
        }

        setUploadedImage(file);
        const result = await processCarImageGated(file);
        if (!result.success) {
          throw new Error(actionError(result.error, t("processFailed")));
        }

        setCarData(result.data);
        setShowForm(true);
        toast.success(t("extracted"));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("unexpected"));
      } finally {
        setIsProcessing(false);
      }
    },
    [t, number, actionError],
  );

  const { isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleStartOver = () => {
    setShowForm(false);
    setCarData(null);
    setUploadedImage(null);
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
        images: uploadedImage ? [uploadedImage] : [],
      }
    : {};

  return (
    <div className="w-full mx-auto px-0 sm:px-6">
      {!showForm ? (
        <AIUploadSection
          onDrop={onDrop}
          isProcessing={isProcessing}
          error={error}
          isDragActive={isDragActive}
        />
      ) : (
        <CarFormShared
          initialData={initialData}
          isAIMode={true}
          onStartOver={handleStartOver}
          aiConfidence={carData?.confidence}
          uploadedImage={uploadedImage}
        />
      )}
    </div>
  );
};

export default AICarForm;
