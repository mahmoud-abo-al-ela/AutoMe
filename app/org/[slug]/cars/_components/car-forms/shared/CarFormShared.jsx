"use client";

import { CarFormPresenter } from "./CarFormPresenter";
import { useCarForm } from "@/hooks/use-car-form";

const CarFormShared = ({
  initialData = {},
  isAIMode = false,
  onStartOver = null,
  aiConfidence = null,
  uploadedImage = null,
}) => {
  const { form, currentSection, formSections, loading, handlers } = useCarForm(initialData);

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
    />
  );
};

export default CarFormShared;
