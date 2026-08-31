"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Camera, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCarImageGallery } from "./useCarImageGallery";
import type { CarDetailImage } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

const CarImageGallery = ({
  images,
  make,
  model,
  title,
}: {
  images: CarDetailImage[] | undefined;
  make: string;
  model: string;
  title: string | null;
}) => {
  const t = useTranslations("carDetail.gallery");
  const fmt = useFormatters();
  const {
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
  } = useCarImageGallery(images);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
        <Camera className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-300" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={galleryRef}
        className="space-y-3 sm:space-y-4"
        tabIndex={0}
        onKeyDown={handleGalleryKeyDown}
        role="region"
        aria-label={t("label")}
        aria-roledescription="carousel"
      >
        {/* Main Image Display */}
        <div className="relative group">
          <div
            className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-xl cursor-pointer"
            onClick={() => setIsImageModalOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[currentImageIndex].url}
              alt={t("imageAlt", {
                make,
                model,
                index: fmt.number(currentImageIndex + 1),
                total: fmt.number(images.length),
              })}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={1000}
              height={625}
              priority
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Zoom hint icon */}
            <div className="absolute top-3 end-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn className="w-4 h-4" />
            </div>
          </div>

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label={t("previous")}
                className="absolute start-2 sm:start-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 cursor-pointer"
                size="icon"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label={t("next")}
                className="absolute end-2 sm:end-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 cursor-pointer"
                size="icon"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-2 sm:bottom-4 end-2 sm:end-4 bg-black/70 backdrop-blur-sm text-white px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
            {fmt.number(currentImageIndex + 1)} / {fmt.number(images.length)}
          </div>
        </div>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <div className="relative">
            <div
              ref={thumbnailContainerRef}
              className="flex gap-2 sm:gap-3 overflow-x-auto p-1 snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={t("viewImage", { index: fmt.number(index + 1) })}
                  aria-current={index === currentImageIndex ? "true" : undefined}
                  className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-18 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 snap-start cursor-pointer ${index === currentImageIndex
                      ? "ring-2 ring-blue-500 shadow-lg shadow-blue-200/50"
                      : "ring-1 ring-gray-200 hover:ring-gray-300 opacity-70 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={image.url}
                    alt={t("thumbnail", { index: fmt.number(index + 1) })}
                    className="w-full h-full object-cover"
                    width={100}
                    height={80}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl w-full bg-black/95 border-0">
          <DialogHeader>
            <DialogTitle className="text-white text-sm sm:text-base md:text-lg">
              {t("galleryTitle", { title: title || `${make} ${model}` })}
            </DialogTitle>
          </DialogHeader>
          <div
            className="relative aspect-[16/10]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[currentImageIndex].url}
              alt={t("imageAltShort", {
                make,
                model,
                index: fmt.number(currentImageIndex + 1),
              })}
              className="w-full h-full object-contain"
              width={1200}
              height={750}
            />
            {images.length > 1 && (
              <>
                <Button
                  onClick={prevImage}
                  aria-label={t("previous")}
                  className="absolute start-2 sm:start-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-3 rounded-full cursor-pointer transition-colors"
                  size="icon"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 rtl:rotate-180" />
                </Button>
                <Button
                  onClick={nextImage}
                  aria-label={t("next")}
                  className="absolute end-2 sm:end-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-3 rounded-full cursor-pointer transition-colors"
                  size="icon"
                >
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 rtl:rotate-180" />
                </Button>
              </>
            )}
          </div>
          <div className="flex justify-center items-center gap-2 text-white text-sm sm:text-base">
            {fmt.number(currentImageIndex + 1)} / {fmt.number(images.length)}
          </div>
          {images.length > 1 && (
            <div
              ref={modalThumbnailRef}
              className="flex gap-2 overflow-x-auto p-2 snap-x scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={t("viewImage", { index: fmt.number(index + 1) })}
                  className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 rounded-md overflow-hidden snap-start cursor-pointer transition-all duration-200 ${index === currentImageIndex
                      ? "ring-2 ring-blue-500 opacity-100"
                      : "ring-2 ring-transparent hover:ring-gray-400 opacity-60 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={image.url}
                    alt={t("thumbnail", { index: fmt.number(index + 1) })}
                    className="w-full h-full object-cover"
                    width={80}
                    height={60}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CarImageGallery;
