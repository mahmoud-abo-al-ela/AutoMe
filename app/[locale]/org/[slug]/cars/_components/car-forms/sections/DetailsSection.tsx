"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import FormSection from "../shared/FormSection";
import FieldInfo from "../shared/FieldInfo";
import { VALIDATION_RULES } from "@/lib/constants/validation";
import type { CarFormSectionProps } from "../shared/section-props";

/** Read from the rules rather than restated, so the copy quoting these limits
 * cannot drift from the validation that enforces them. */
const MIN_DESCRIPTION = VALIDATION_RULES.CAR.DESCRIPTION_MIN_LENGTH;
const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

/** A blob URL kept alive for one File in the form's `images` array. */
interface ImagePreview {
  file: File;
  url: string;
}

type DetailsSectionProps = Pick<
  CarFormSectionProps,
  "register" | "errors" | "watch" | "setValue"
> & {
  maxImages?: number;
};

const DetailsSection = ({
  register,
  errors,
  watch,
  setValue,
  maxImages = 5,
}: DetailsSectionProps) => {
  const t = useTranslations("org.carForm");
  const tField = useTranslations("carAttributes.fields");
  const { number } = useFormatters();
  const watchImages = watch("images");
  const [imagePreviews, setImagePreviews] = useState<
    Record<number, ImagePreview>
  >({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxImages,
    maxSize: MAX_IMAGE_BYTES,
    onDrop: (acceptedFiles) => {
      const currentImages = watchImages || [];
      const newImages = [...currentImages, ...acceptedFiles].slice(0, maxImages);
      setValue("images", newImages, { shouldValidate: true });
    },
    onDropRejected: (fileRejections) => {
      if (
        fileRejections.some((rejection) =>
          rejection.errors.some((error) => error.code === "too-many-files")
        )
      ) {
        toast.error(t("images.tooMany", { count: number(maxImages) }));
      } else {
        toast.error(t("images.failed"));
      }
    },
  });

  // Create and cache preview URLs
  useEffect(() => {
    if (!watchImages) return;

    const newPreviews: Record<number, ImagePreview> = {};
    watchImages.forEach((image, index) => {
      if (image instanceof File) {
        // Reuse existing preview or create new one
        if (imagePreviews[index] && imagePreviews[index].file === image) {
          newPreviews[index] = imagePreviews[index];
        } else {
          newPreviews[index] = {
            file: image,
            url: URL.createObjectURL(image)
          };
        }
      }
    });

    setImagePreviews(newPreviews);

    // Cleanup old previews that are no longer in use
    return () => {
      Object.keys(imagePreviews).forEach((key) => {
        const index = Number(key);
        if (!newPreviews[index] && imagePreviews[index]?.url) {
          URL.revokeObjectURL(imagePreviews[index].url);
        }
      });
    };
    // `imagePreviews` is read to reuse blob URLs but is also what this effect
    // sets, so listing it would re-run the effect on its own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchImages]);

  const removeImage = (index: number) => {
    const updatedImages = (watchImages ?? []).filter((_, i) => i !== index);

    // Revoke the preview URL for the removed image
    if (imagePreviews[index]?.url) {
      URL.revokeObjectURL(imagePreviews[index].url);
    }

    setValue("images", updatedImages, { shouldValidate: true });
  };

  return (
    <FormSection title={t("sections.details")}>
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center">
          {tField("location")} <FieldInfo text={t("fields.locationHint")} />
        </Label>
        <Input
          type="text"
          id="location"
          placeholder={t("fields.locationPlaceholder")}
          {...register("location")}
          className={`${errors.location ? "border-red-500" : ""}`}
        />
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center">
          {t("fields.descriptionLabel")}{" "}
          <FieldInfo text={t("fields.descriptionHint")} />
        </Label>
        <Textarea
          id="description"
          placeholder={t("fields.descriptionPlaceholder")}
          className={`min-h-[120px] sm:min-h-[150px] ${errors.description ? "border-red-500" : ""
            }`}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
        <div className="flex justify-between mt-1 text-xs sm:text-base">
          <p className="text-gray-500">
            {t("fields.descriptionMin", { count: number(MIN_DESCRIPTION) })}
          </p>
          <p className="text-gray-500">
            {t("fields.descriptionCount", {
              count: number(watch("description")?.length || 0),
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images" className="flex items-center">
          {t("images.label")}{" "}
          <FieldInfo text={t("images.hint", { count: number(maxImages) })} />
        </Label>
        {watchImages?.length < maxImages ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
              } ${errors.images ? "border-red-500" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2 text-xs sm:text-base">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 sm:w-12 sm:h-12" />
                <p className="text-gray-600">
                  {isDragActive ? t("images.drop") : t("images.prompt")}
                </p>
                <p className="text-gray-500">
                  {t("images.limits", {
                    count: number(maxImages),
                    size: number(MAX_IMAGE_MB),
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm sm:text-base">
            {t("images.full", { count: number(maxImages) })}
          </p>
        )}
        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
        )}{" "}
        {watchImages?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchImages.map((image, index) => {
              // Use cached preview URL
              const imageSrc = imagePreviews[index]?.url || (typeof image === 'string' ? image : '');

              return (
                <div key={index} className="relative">
                  {imageSrc && (
                    <Image
                      src={imageSrc}
                      alt={t("images.previewAlt", { index: number(index + 1) })}
                      className="w-full h-40 object-contain rounded-lg"
                      width={100}
                      height={100}
                      priority
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    aria-label={t("images.remove", { index: number(index + 1) })}
                    className="absolute cursor-pointer top-1 end-0 p-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
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
