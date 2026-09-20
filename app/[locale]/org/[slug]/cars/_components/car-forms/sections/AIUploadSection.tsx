"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileImage, Upload, Brain } from "lucide-react";
import React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";

interface AIUploadSectionProps {
  onDrop: NonNullable<DropzoneOptions["onDrop"]>;
  isProcessing: boolean;
  error?: string | null;
  /** Drag state is owned by the parent's own dropzone, not this one. */
  isDragActive?: boolean;
}

const AIUploadSection = ({
  onDrop,
  isProcessing,
  error,
  isDragActive,
}: AIUploadSectionProps) => {
  const t = useTranslations("org.carForm.ai");
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  return (
    <div className="w-full sm:w-[70vw] mx-auto sm:px-6 sm:mt-8">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-10 w-10 text-purple-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("processingTitle")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("processingBody")}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full animate-pulse"
                  style={{ width: "70%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {t("processingWait")}
              </p>
            </div>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors ${
                  isDragActive ? "border-purple-400 bg-purple-50" : ""
                } ${
                  isProcessing
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileImage className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("uploadTitle")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isDragActive ? t("uploadDropping") : t("uploadPrompt")}
                </p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 mb-4"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 me-2" />
                  {t("choose")}
                </Button>
                <p className="text-sm text-gray-500">
                  {t("formats")}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {t("featuresTitle")}
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• {t("feature1")}</li>
                      <li>• {t("feature2")}</li>
                      <li>• {t("feature3")}</li>
                      <li>• {t("feature4")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUploadSection;
