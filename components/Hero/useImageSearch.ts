"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { processImagesSearch } from "@/actions/home";

const MAX_IMAGE_MB = 10;

/**
 * Owns the "search by photo" flow for the hero: file selection (picker + drag),
 * client-side validation, preview, the AI mutation, and the detected-filters
 * redirect. HeroSearch stays a thin composition over what this returns.
 */
export function useImageSearch() {
  const t = useTranslations("home.hero");
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const changeImageRef = useRef<HTMLInputElement | null>(null);

  const {
    data: result,
    isPending: loading,
    error,
    mutateAsync,
  } = useMutation({ mutationFn: processImagesSearch });

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // On success, announce what was detected and jump to the filtered listing.
  useEffect(() => {
    if (!result?.success) return;
    const { make, bodyType, color } = result.data;
    const detected = [color, make, bodyType].filter(Boolean).join(" ");
    if (detected) toast.success(t("detected", { attributes: detected }));

    const params = new URLSearchParams();
    if (make) params.append("make", make);
    if (bodyType) params.append("bodyType", bodyType);
    if (color) params.append("color", color);
    router.push(`/cars?${params.toString()}`);
  }, [result, router, t]);

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageType"));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(t("imageTooLarge", { max: MAX_IMAGE_MB }));
      return;
    }

    setSelectedImage(file);
    setIsActive(true);
    const reader = new FileReader();
    // readAsDataURL always yields a string; the union is for the other read
    // methods on FileReader.
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    if (loading) return;
    setSelectedImage(null);
    setImagePreview(null);
    setIsActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (changeImageRef.current) changeImageRef.current.value = "";
  };

  const search = async () => {
    if (!selectedImage) {
      toast.error(t("noImageSelected"));
      return;
    }
    await mutateAsync(selectedImage);
  };

  // Spread onto the drop target so the search bar accepts dragged images.
  const dragProps = {
    onDragOver: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      // Ignore drag-leave events bubbling from children.
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      setIsDragging(false);
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setIsDragging(false);
      selectFile(e.dataTransfer.files?.[0]);
    },
  };

  return {
    isActive,
    isDragging,
    loading,
    imagePreview,
    fileName: selectedImage?.name,
    fileInputRef,
    changeImageRef,
    dragProps,
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      selectFile(e.target.files?.[0]),
    openPicker: () => fileInputRef.current?.click(),
    openChangePicker: () => changeImageRef.current?.click(),
    search,
    reset,
  };
}
