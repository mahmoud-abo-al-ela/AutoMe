"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { CarDetailImage } from "../_lib/car-detail-types";

/**
 * All interaction logic for the car image gallery: index state, next/prev,
 * keyboard + touch navigation, adjacent-image preloading, and keeping the
 * active thumbnail scrolled into view. Keeps CarImageGallery presentational.
 */
export function useCarImageGallery(images: CarDetailImage[] | undefined) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const modalThumbnailRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  const nextImage = useCallback(() => {
    if (!images?.length) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  const prevImage = useCallback(() => {
    if (!images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  // Keyboard navigation for the gallery
  const handleGalleryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImage();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsImageModalOpen(true);
      }
    },
    [prevImage, nextImage]
  );

  // Keyboard navigation for the modal
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImage();
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [isImageModalOpen, prevImage, nextImage]);

  // Touch swipe gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [nextImage, prevImage]);

  // Preload adjacent images
  useEffect(() => {
    if (!images?.length || images.length <= 1) return;

    const preloadImage = (index: number) => {
      const src = images[index]?.url;
      if (src) {
        const img = new window.Image();
        img.src = src;
      }
    };

    const nextIdx = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    const prevIdx = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;

    preloadImage(nextIdx);
    preloadImage(prevIdx);
  }, [currentImageIndex, images]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    const container = isImageModalOpen
      ? modalThumbnailRef.current
      : thumbnailContainerRef.current;
    if (!container) return;

    const activeThumb = container.children[currentImageIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentImageIndex, isImageModalOpen]);

  return {
    currentImageIndex,
    setCurrentImageIndex,
    isImageModalOpen,
    setIsImageModalOpen,
    nextImage,
    prevImage,
    handleGalleryKeyDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    galleryRef,
    thumbnailContainerRef,
    modalThumbnailRef,
  };
}
