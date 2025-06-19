import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { processCarImageWithAI } from "@/actions/cars";
import { toast } from "sonner";
import CarFormShared from "../shared/CarFormShared";
import AIUploadSection from "../sections/AIUploadSection";

const AICarForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [carData, setCarData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setCarData(null);

    try {
      const file = acceptedFiles[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Please upload JPG, PNG, or WEBP.");
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit.");
      }

      setUploadedImage(file);
      const result = await processCarImageWithAI(file);
      if (result.success) {
        setCarData(result.data);
        setShowForm(true);
        toast.success("Car details extracted successfully");
        console.log(result);
      } else {
        throw new Error(result.error || "Failed to process image.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
  // Prepare initial data for the form
  const initialData = carData
    ? {
        make: carData.make || "",
        model: carData.model || "",
        year: carData.year || "",
        price: carData.price || "",
        mileage: carData.mileage || "",
        bodyType: carData.bodyType || "",
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
