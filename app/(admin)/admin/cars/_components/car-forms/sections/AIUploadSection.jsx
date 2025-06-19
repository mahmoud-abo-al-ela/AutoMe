import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileImage, Upload, Brain } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

const AIUploadSection = ({ onDrop, isProcessing, error, isDragActive }) => {
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
                AI Processing Images
              </h3>
              <p className="text-gray-600 mb-6">
                Our AI is analyzing your images and extracting car details...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full animate-pulse"
                  style={{ width: "70%" }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                This usually takes 30-60 seconds
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
                  Upload Car Images
                </h3>
                <p className="text-gray-600 mb-6">
                  {isDragActive
                    ? "Drop your car image here..."
                    : "Drop your car images here or click to browse. Our AI will automatically extract car details."}
                </p>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 mb-4"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </Button>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, WEBP up to 10MB each
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
                      AI Features
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Automatic make, model, and year detection</li>
                      <li>• Price estimation based on market data</li>
                      <li>• Feature extraction from images</li>
                      <li>• Quality and condition assessment</li>
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
