"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";

/**
 * `compact` renders the control as a 48px row, the same height as an Input, so
 * the logo occupies one cell of the form grid like every other field. The
 * square tile it replaced was 112px tall and sat beside a 48px name field,
 * leaving a block of dead space that no other row had.
 */
export default function LogoUpload({
  value,
  onChange,
  error,
  compact = false,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  error?: string;
  compact?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Both rejections used to be a bare `return`, so dropping a PDF or an
    // oversized photo did nothing at all — no message, no state change.
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview - actual upload happens on org creation
      const reader = new FileReader();
      reader.onloadend = () => {
        // readAsDataURL always yields a string; the union is for the other read
        // modes on the shared FileReader interface.
        if (typeof reader.result === "string") {
          onChange(reader.result);
        }
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
            className={
              compact
                ? "flex h-12 items-center gap-3 rounded-md border border-green-200 bg-green-50 px-3"
                : "relative w-28 h-28 rounded-xl overflow-hidden border-2 border-green-200 bg-green-50"
            }
          >
            {compact ? (
              <>
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
                  <Image
                    src={value}
                    alt="Organization logo"
                    fill
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-green-800">
                  Logo added
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label="Remove logo"
                  // A solid red fill on hover was heavier than the green row it
                  // sits in; tinting the icon reads as destructive without
                  // becoming the loudest thing on the form.
                  className="shrink-0 cursor-pointer rounded-full p-1 text-green-700/70 transition-colors hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Image
                  src={value}
                  alt="Organization logo"
                  fill
                  className="object-contain p-2"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 end-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative border-2 border-dashed text-center transition-colors cursor-pointer ${
              compact
                ? "flex h-12 items-center rounded-md px-3"
                : "rounded-xl p-4"
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
              <div className="flex w-full items-center gap-2">
                <ImageIcon className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Add logo
                </span>
                <span className="ms-auto text-xs text-gray-400">
                  PNG/JPG · 5MB
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-100 rounded-full shrink-0">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-start">
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
