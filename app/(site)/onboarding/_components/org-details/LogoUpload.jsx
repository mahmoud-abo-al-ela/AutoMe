"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";

/**
 * `compact` renders a square tile sized to sit beside the Dealership Name
 * field. The old full-width dropzone lived in its own grid column and left a
 * large dead area beneath it, since the box is much shorter than the field
 * stack next to it.
 */
export default function LogoUpload({ value, onChange, error, compact = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview - actual upload happens on org creation
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        console.error("Error reading file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing logo:", error);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        Dealership Logo
        <span className="text-red-500">*</span>
      </Label>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-green-200 bg-green-50"
          >
            <Image
              src={value}
              alt="Organization logo"
              fill
              className="object-contain p-2"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
              compact
                ? "w-28 h-28 flex items-center justify-center p-2"
                : "p-4"
            } ${
              error
                ? "border-red-400 bg-red-50"
                : dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {isUploading ? (
              <div className="flex items-center justify-center gap-3 py-2">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : compact ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-2 bg-gray-100 rounded-full">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs font-medium leading-tight text-gray-600">
                  Add logo
                </p>
                <p className="text-[10px] leading-tight text-gray-400">
                  PNG/JPG · 5MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-100 rounded-full shrink-0">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">
                    Drop your logo here or{" "}
                    <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
