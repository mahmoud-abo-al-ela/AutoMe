"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processImagesSearch } from "@/actions/home";

const MAX_IMAGE_MB = 10;

/**
 * Owns the "search by photo" flow for the hero: file selection (picker + drag),
 * client-side validation, preview, the AI mutation, and the detected-filters
 * redirect. HeroSearch stays a thin composition over what this returns.
 */
export function useImageSearch() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const changeImageRef = useRef(null);

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
    if (detected) toast.success(`Detected ${detected}`);

    const params = new URLSearchParams();
    if (make) params.append("make", make);
    if (bodyType) params.append("bodyType", bodyType);
    if (color) params.append("color", color);
    router.push(`/cars?${params.toString()}`);
  }, [result, router]);

  const selectFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }

    setSelectedImage(file);
    setIsActive(true);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
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
      toast.error("Please select an image");
      return;
    }
    await mutateAsync(selectedImage);
  };

  // Spread onto the drop target so the search bar accepts dragged images.
  const dragProps = {
    onDragOver: (e) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      // Ignore drag-leave events bubbling from children.
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setIsDragging(false);
    },
    onDrop: (e) => {
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
    onFileInputChange: (e) => selectFile(e.target.files?.[0]),
    openPicker: () => fileInputRef.current?.click(),
    openChangePicker: () => changeImageRef.current?.click(),
    search,
    reset,
  };
}
