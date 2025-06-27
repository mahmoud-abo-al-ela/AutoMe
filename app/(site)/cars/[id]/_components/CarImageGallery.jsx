"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CarImageGallery = ({ images, make, model, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const nextImage = () => {
    if (!images?.length) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (!images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
        <Camera className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-300" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Main Image Display */}
        <div className="relative group">
          <div
            className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-lg cursor-pointer"
            onClick={() => setIsImageModalOpen(true)}
          >
            <Image
              src={images[currentImageIndex]?.url || images[currentImageIndex]}
              alt={`${make} ${model}`}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 "
              width={1000}
              height={600}
              priority
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <Button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-1 sm:p-2 md:p-3 rounded-full shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 cursor-pointer"
                size="icon"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 p-1 sm:p-2 md:p-3 rounded-full shadow-lg opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 cursor-pointer"
                size="icon"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/80 backdrop-blur-sm text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Image Thumbnails */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x">
          {images.map((image, index) => (
            <Button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-14 sm:w-20 sm:h-16 md:w-24 md:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 snap-start p-1 cursor-pointer ${
                index === currentImageIndex
                  ? "border-blue-500 shadow-lg shadow-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image
                src={image.url || image}
                alt={`View ${index + 1}`}
                className="w-full h-full object-cover"
                width={100}
                height={80}
              />
            </Button>
          ))}
        </div>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl w-full bg-black/95 border-0">
          <DialogHeader>
            <DialogTitle className="text-white text-sm sm:text-base md:text-lg">
              {title || `${make} ${model}`} - Gallery
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video">
            <Image
              src={images[currentImageIndex]?.url || images[currentImageIndex]}
              alt={`${make} ${model}`}
              className="w-full h-full object-contain"
              width={1200}
              height={800}
            />
            <Button
              onClick={prevImage}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 text-white p-1 sm:p-3 rounded-full cursor-pointer"
              size="icon"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </Button>
            <Button
              onClick={nextImage}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 text-white p-1 sm:p-3 rounded-full cursor-pointer"
              size="icon"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </Button>
          </div>
          <div className="flex justify-center items-center gap-2 text-white text-sm sm:text-base">
            {currentImageIndex + 1} / {images.length}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {images.map((image, index) => (
              <Button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 rounded-md overflow-hidden border-1 snap-start p-1 cursor-pointer ${
                  index === currentImageIndex
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={image.url || image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={80}
                  height={60}
                />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CarImageGallery;
