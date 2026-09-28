"use client";

import { useState, useEffect } from "react";
import { CarFormPresenter } from "./CarFormPresenter";
import { useCarForm } from "@/hooks/use-car-form";
import { getMaxImagesPerCar } from "@/actions/cars";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import type { CarFormInitialData } from "@/hooks/use-car-form";

interface CarFormSharedProps {
  initialData?: CarFormInitialData;
  isAIMode?: boolean;
  onStartOver?: (() => void) | null;
  aiConfidence?: number | null;
  uploadedImage?: File | null;
  /** The generation's model years the AI saw, for the dealer to confirm the year. */
  aiYears?: { from: number; to: number } | null;
  /** Hand the saved car back instead of going to the car list (bulk import). */
  onSaved?: (car: { id: string }) => void;
  isEditMode?: boolean;
  carId?: string | null;
}

const CarFormShared = ({
  initialData = {},
  isAIMode = false,
  onStartOver = null,
  aiConfidence = null,
  uploadedImage = null,
  aiYears = null,
  onSaved,
  isEditMode = false,
  carId = null,
}: CarFormSharedProps) => {
  const [maxImages, setMaxImages] = useState(VALIDATION_RULES.CAR.MAX_IMAGES);

  useEffect(() => {
    const fetchMaxImages = async () => {
      try {
        const result = await getMaxImagesPerCar();
        if (result?.success && result.data?.maxImagesPerCar) {
          setMaxImages(result.data.maxImagesPerCar);
        }
      } catch (error) {
        console.error("Failed to fetch max images per car:", error);
      }
    };
    fetchMaxImages();
  }, []);

  const { form, currentSection, formSections, loading, handlers } = useCarForm(
    initialData,
    maxImages,
    isEditMode,
    carId,
    onSaved
  );

  return (
    <CarFormPresenter
      form={form}
      currentSection={currentSection}
      formSections={formSections}
      loading={loading}
      isAIMode={isAIMode}
      onStartOver={onStartOver}
      aiConfidence={aiConfidence}
      uploadedImage={uploadedImage}
      aiYears={aiYears}
      handlers={handlers}
      maxImages={maxImages}
      isEditMode={isEditMode}
    />
  );
};

export default CarFormShared;
