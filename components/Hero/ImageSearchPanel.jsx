"use client";

import { motion } from "framer-motion";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

/**
 * The expanded "search by photo" panel: preview, an analyzing overlay while the
 * AI runs, and the cancel / change / search controls. Pure presenter — all state
 * and handlers come from useImageSearch.
 */
const ImageSearchPanel = ({
  imagePreview,
  fileName,
  loading,
  changeImageRef,
  onFileInputChange,
  onCancel,
  onChangeImage,
  onSearch,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="absolute top-0 left-0 w-full bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-3 sm:p-4 z-20 mt-2 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700">
          <Camera size={15} className="text-primary" />
          Search by photo
        </p>
        <button
          type="button"
          aria-label="Close photo search"
          onClick={onCancel}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X size={20} className="sm:size-[22px]" />
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="relative w-full h-28 sm:h-36 md:h-44 bg-gray-100 rounded-lg overflow-hidden">
          {imagePreview && (
            <Image
              src={imagePreview}
              alt="Selected car"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority
            />
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/60 backdrop-blur-[2px] text-white"
            >
              <Loader2 size={26} className="animate-spin" />
              <span className="text-xs sm:text-sm font-medium">Analyzing image…</span>
            </motion.div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-600 truncate">{fileName}</p>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="text-xs cursor-pointer h-8 sm:h-9 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            type="button"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onChangeImage}
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1 cursor-pointer h-8 sm:h-9 text-primary border-primary/40 hover:bg-primary/5 hover:text-primary"
            type="button"
            disabled={loading}
          >
            <Upload size={12} className="sm:size-[14px]" />
            Change
          </Button>
          <Button
            className="text-xs sm:ml-auto bg-primary text-white hover:bg-primary/90 hover:text-white cursor-pointer h-8 sm:h-9 min-w-[9.5rem] justify-center"
            size="sm"
            onClick={onSearch}
            type="button"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" />
                Analyzing…
              </span>
            ) : (
              "Search With Image"
            )}
          </Button>
        </div>

        <input
          ref={changeImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>
    </motion.div>
  );
};

export default ImageSearchPanel;
