"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * `compact` renders the control as a 48px row, the same height as an Input, so
 * the logo occupies one cell of the form grid like every other field. The
 * square tile it replaced was 112px tall and sat beside a 48px name field,
 * leaving a block of dead space that no other row had.
 */
/** Matches the size the messages quote, so copy and check cannot disagree. */
const MAX_LOGO_MB = 5;

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
  const t = useTranslations("onboarding.orgDetails.logo");
  const fmt = useFormatters();
  const maxSizeLabel = fmt.number(MAX_LOGO_MB);
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
      toast.error(t("notAnImage"));
      return;
    }

    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(t("tooLarge", { size: maxSizeLabel }));
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
      <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        {t("label")}
        <span className="text-destructive">*</span>
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
                ? "flex h-12 items-center gap-3 rounded-md border border-positive/30 bg-positive-soft px-3"
                : "relative w-28 h-28 rounded-control overflow-hidden border-2 border-positive/30 bg-positive-soft"
            }
          >
            {compact ? (
              <>
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-card">
                  <Image
                    src={value}
                    alt={t("alt")}
                    fill
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-positive">
                  {t("added")}
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label={t("remove")}
                  // A solid red fill on hover was heavier than the green row it
                  // sits in; tinting the icon reads as destructive without
                  // becoming the loudest thing on the form.
                  className="shrink-0 cursor-pointer rounded-full p-1 text-positive/70 transition-colors hover:bg-destructive-soft hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Image
                  src={value}
                  alt={t("alt")}
                  fill
                  className="object-contain p-2"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label={t("remove")}
                  className="absolute top-1 end-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive transition-colors"
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
                : "rounded-control p-4"
            } ${
              error
                ? "border-red-400 bg-destructive-soft"
                : dragActive
                  ? "border-primary/30 bg-primary-soft"
                  : "border-border hover:border-gray-400 hover:bg-muted"
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
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">{t("uploading")}</p>
              </div>
            ) : compact ? (
              <div className="flex w-full items-center gap-2">
                <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("addShort")}
                </span>
                <span className="ms-auto text-xs text-muted-foreground">
                  {t("constraintShort", { size: maxSizeLabel })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-muted rounded-full shrink-0">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-start">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.rich("dropHint", {
                      browse: (chunks) => (
                        <span className="text-primary">{chunks}</span>
                      ),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("constraint", { size: maxSizeLabel })}
                  </p>
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
          className="text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
