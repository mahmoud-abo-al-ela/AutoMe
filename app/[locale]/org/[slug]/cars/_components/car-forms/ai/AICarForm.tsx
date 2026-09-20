import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { processCarImageGated } from "@/actions/cars";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import CarFormShared from "../shared/CarFormShared";
import AIUploadSection from "../sections/AIUploadSection";

/** The upload cap the copy quotes, stated once so the two cannot disagree. */
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * What the vision model extracts. The action checks only that these keys are
 * present, not their types — the model can still return a string where a number
 * belongs, which is why the numeric fields are widened here and coerced by the
 * form's Zod schema on submit.
 */
interface ExtractedCarData {
  make?: string;
  model?: string;
  year?: string | number;
  price?: string | number;
  mileage?: string | number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  seats?: string | number;
  features?: string | string[];
  description?: string;
  confidence?: number;
}

const AICarForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carData, setCarData] = useState<ExtractedCarData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const t = useTranslations("org.carForm.ai");
  const { number } = useFormatters();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
      if (result.success) {
        setCarData(result.data as ExtractedCarData);
        setShowForm(true);
        toast.success(t("extracted"));
      } else {
        throw new Error(result.error?.message || t("processFailed"));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("unexpected"),
      );
    } finally {
      setIsProcessing(false);
    }
  }, [t, number]);

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

  // Normalize bodyType value
  const normalizeBodyType = (bodyType: string | undefined) => {
    if (bodyType === "Sport Utility Vehicle (SUV)") {
      return "SUV";
    }
    return bodyType;
  };

  // Prepare initial data for the form
  const initialData = carData
    ? {
        make: carData.make || "",
        model: carData.model || "",
        year: carData.year || "",
        price: carData.price || "",
        mileage: carData.mileage || "",
        bodyType: normalizeBodyType(carData.bodyType) || "",
        fuelType: carData.fuelType || "",
        transmission: carData.transmission || "",
        color: carData.color || "",
        seats: carData.seats || "",
        features: carData.features || "",
        description: carData.description || "",
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
