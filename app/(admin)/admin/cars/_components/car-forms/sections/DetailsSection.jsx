import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import FormSection from "../shared/FormSection";
import FieldInfo from "./FieldInfo";

const DetailsSection = ({ register, errors, watch, setValue }) => {
  const watchImages = watch("images");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 5,
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      const filesWithPreview = acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );
      const currentImages = watchImages || [];
      const newImages = [...currentImages, ...filesWithPreview].slice(0, 5);
      setValue("images", newImages, { shouldValidate: true });
    },
    onDropRejected: (fileRejections) => {
      if (
        fileRejections.some((rejection) =>
          rejection.errors.some((error) => error.code === "too-many-files")
        )
      ) {
        toast.error("You can only upload up to 5 images.");
      } else {
        toast.error("Failed to upload image. Please try again.");
      }
    },
  });
  useEffect(() => {
    return () => {
      watchImages?.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [watchImages]);
  const removeImage = (index) => {
    const updatedImages = watchImages.filter((_, i) => i !== index);
    // Only revoke object URL if the image has a preview property
    if (watchImages[index].preview) {
      URL.revokeObjectURL(watchImages[index].preview);
    }
    setValue("images", updatedImages, { shouldValidate: true });
  };

  return (
    <FormSection title="Additional Details">
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center">
          Location <FieldInfo text="Where the vehicle is currently located" />
        </Label>
        <Input
          type="text"
          id="location"
          placeholder="San Francisco, CA"
          {...register("location")}
          className={`${errors.location ? "border-red-500" : ""}`}
        />
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center">
          Description <FieldInfo text="Detailed description of the vehicle" />
        </Label>
        <Textarea
          id="description"
          placeholder="Detailed description of the vehicle..."
          className={`min-h-[120px] sm:min-h-[150px] ${
            errors.description ? "border-red-500" : ""
          }`}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
        <div className="flex justify-between mt-1 text-xs sm:text-base">
          <p className="text-gray-500">Min 10 characters required</p>
          <p className="text-gray-500">
            {watch("description")?.length || 0} characters
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images" className="flex items-center">
          Images <FieldInfo text="Add up to 5 images of the vehicle" />
        </Label>
        {watchImages?.length < 5 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
              } ${errors.images ? "border-red-500" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2 text-xs sm:text-base">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12" />
                <p className="text-gray-600">
                  {isDragActive
                    ? "Drop the images here"
                    : "Drag & drop images here, or click to select"}
                </p>
                <p className="text-gray-500">Max 5 images, up to 5MB each</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm sm:text-base">
            Maximum of 5 images uploaded. Remove an image to add a new one.
          </p>
        )}
        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
        )}{" "}
        {watchImages?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchImages.map((image, index) => {
              // Handle both cases: images with preview (from dropzone) and File objects (from initial data)
              let imageSrc;
              if (image.preview) {
                imageSrc = image.preview;
              } else if (image instanceof File) {
                imageSrc = URL.createObjectURL(image);
              } else {
                // Fallback for any other format
                imageSrc = image;
              }

              return (
                <div key={index} className="relative">
                  <Image
                    src={imageSrc}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-contain rounded-lg"
                    width={100}
                    height={100}
                    priority
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute cursor-pointer top-1 right-0 p-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default DetailsSection;
