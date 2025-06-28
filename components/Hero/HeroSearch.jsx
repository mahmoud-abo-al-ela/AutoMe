"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Camera, X, Upload } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Image from "next/image";
import { processImagesSearch } from "@/actions/home";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const HeroSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const changeImageRef = useRef(null);

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    // Redirect to cars page with search query
    router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const {
    data: imageSearch,
    loading,
    error,
    fn: fetchImageSearch,
  } = useFetch(processImagesSearch);

  const handleImageSearch = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }
    console.log("Starting image search with file:", selectedImage);
    toast.info("Processing image...");
    await fetchImageSearch(selectedImage);
  };

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (imageSearch?.success) {
      console.log(imageSearch);
      const params = new URLSearchParams();
      if (imageSearch.data.make) {
        params.append("make", imageSearch.data.make);
      }
      if (imageSearch.data.bodyType) {
        params.append("bodyType", imageSearch.data.bodyType);
      }
      if (imageSearch.data.color) {
        params.append("color", imageSearch.data.color);
      }
      router.push(`/cars?${params.toString()}`);
    }
  }, [imageSearch, router]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setIsActive(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      console.log("Image uploaded:", file.name);
    }
  };

  const resetImageSearch = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIsActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (changeImageRef.current) changeImageRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerChangeImage = () => {
    changeImageRef.current?.click();
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {!isActive && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 mb-5 sm:mb-6 md:mb-8 px-2 sm:px-0"
          onSubmit={handleSearch}
        >
          <div className="relative flex-grow">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 sm:size-[18px]"
            />
            <Input
              type="search"
              placeholder="Search by model, or keyword..."
              className="pl-9 h-10 sm:h-11 md:h-12 text-sm md:text-base text-gray-800 bg-white/95 backdrop-blur-sm rounded-lg border-0 focus-visible:ring-primary shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div
              onClick={triggerFileInput}
              title="Photo Search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 cursor-pointer hover:text-primary transition-all duration-300 flex items-center gap-1 ${
                searchQuery.trim() ? "hidden" : "block"
              }`}
            >
              <Camera size={18} className="sm:size-[20px]" />
            </div>
            <input
              ref={fileInputRef}
              id="imageUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <Button
            size="lg"
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white h-10 sm:h-11 md:h-12 text-sm md:text-base cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg px-4 sm:px-6"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </Button>
        </motion.form>
      )}

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 md:p-4 z-20 mt-2 border border-gray-100"
          >
            <div className="flex justify-end mb-1 sm:mb-2">
              <X
                size={20}
                className="text-gray-500 hover:text-gray-500/70 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer sm:size-[24px]"
                onClick={resetImageSearch}
              />
            </div>

            {imagePreview && (
              <div className="mt-1 sm:mt-2 md:mt-3 space-y-2 sm:space-y-3">
                <div className="relative w-full h-24 sm:h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {selectedImage.name}
                </p>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    onClick={resetImageSearch}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-gray-500 hover:bg-gray-500/90 text-white cursor-pointer h-8 sm:h-9"
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={triggerChangeImage}
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1 bg-primary text-white hover:bg-primary/90 hover:text-white cursor-pointer h-8 sm:h-9"
                    type="button"
                  >
                    <Upload size={12} className="sm:size-[14px]" />
                    Change
                  </Button>
                  <Button
                    className="text-xs sm:ml-auto bg-primary text-white hover:bg-primary/90 hover:text-white cursor-pointer h-8 sm:h-9"
                    size="sm"
                    onClick={handleImageSearch}
                    type="button"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Search With Image"}
                  </Button>
                </div>
                <input
                  ref={changeImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSearch;
