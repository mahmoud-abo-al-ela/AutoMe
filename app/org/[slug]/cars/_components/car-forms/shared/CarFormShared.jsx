"use client";

import { useState, useEffect } from "react";
import { CarFormPresenter } from "./CarFormPresenter";
import { useCarForm } from "@/hooks/use-car-form";
import { getMaxImagesPerCar } from "@/actions/cars";
import { VALIDATION_RULES } from "@/lib/constants/validation";

const CarFormShared = ({
  initialData = {},
  isAIMode = false,
  onStartOver = null,
  aiConfidence = null,
  uploadedImage = null,
  isEditMode = false,
  carId = null,
}) => {
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
    carId
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
      handlers={handlers}
      maxImages={maxImages}
      isEditMode={isEditMode}
    />
  );
};

export default CarFormShared;
