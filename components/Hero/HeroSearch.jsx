"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Camera, Upload } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useImageSearch } from "./useImageSearch";
import ImageSearchPanel from "./ImageSearchPanel";

const HeroSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const image = useImageSearch();

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    router.push(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {!image.isActive && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 mb-5 sm:mb-6 md:mb-8 px-2 sm:px-0"
          onSubmit={handleSearch}
          {...image.dragProps}
        >
          <div
            className={`relative flex-grow rounded-lg transition-shadow ${
              image.isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent" : ""
            }`}
          >
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 sm:size-[18px]"
            />
            <Input
              type="search"
              placeholder="Search by model, keyword, or drop a photo..."
              className="pl-9 h-10 sm:h-11 md:h-12 text-sm md:text-base text-gray-800 bg-white/95 backdrop-blur-sm rounded-lg border-0 focus-visible:ring-primary shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={image.openPicker}
              title="Search by photo"
              aria-label="Search by photo"
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 cursor-pointer hover:text-primary transition-colors ${
                searchQuery.trim() ? "hidden" : "block"
              }`}
            >
              <Camera size={18} className="sm:size-[20px]" />
            </button>
            <input
              ref={image.fileInputRef}
              id="imageUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={image.onFileInputChange}
            />

            <AnimatePresence>
              {image.isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-white/95 text-sm font-medium text-primary backdrop-blur-sm pointer-events-none"
                >
                  <Upload size={16} />
                  Drop image to search
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            size="lg"
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white h-10 sm:h-11 md:h-12 text-sm md:text-base cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg px-4 sm:px-6"
            disabled={image.loading}
          >
            Search
          </Button>
        </motion.form>
      )}

      <AnimatePresence>
        {image.isActive && (
          <ImageSearchPanel
            imagePreview={image.imagePreview}
            fileName={image.fileName}
            loading={image.loading}
            changeImageRef={image.changeImageRef}
            onFileInputChange={image.onFileInputChange}
            onCancel={image.reset}
            onChangeImage={image.openChangePicker}
            onSearch={image.search}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSearch;
