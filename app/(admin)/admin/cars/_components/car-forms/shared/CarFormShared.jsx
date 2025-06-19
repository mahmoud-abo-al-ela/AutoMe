import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit3, Brain } from "lucide-react";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { addCar } from "@/actions/cars";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import {
  BasicInfoSection,
  SpecificationsSection,
  DetailsSection,
  StatusSection,
} from "../sections";

const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const transmissions = ["Automatic", "Manual", "Semi-Automatic"];
const bodyTypes = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Pickup",
  "Pickup Truck",
];

const carFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .refine(
      (val) => val >= 1900 && val <= new Date().getFullYear(),
      "Invalid year"
    ),
  price: z.number().min(1, "Price is required"),
  mileage: z.number().min(0, "Mileage is required"),
  bodyType: z.string().min(1, "Body Type is required"),
  fuelType: z.string().min(1, "Fuel Type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  color: z.string().min(1, "Color is required"),
  seats: z.number().min(1, "Seats is required"),
  location: z.string().min(1, "Location is required"),
  features: z.array(z.string()).optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["Available", "Sold", "Unavailable"]),
  featured: z.boolean().default(false),
  images: z
    .array(z.instanceof(File))
    .min(1, "At least one image is required")
    .max(5, "Maximum of 5 images allowed"),
});

const CarFormShared = ({
  initialData = {},
  isAIMode = false,
  onStartOver = null,
  aiConfidence = null,
  uploadedImage = null,
}) => {
  const [currentSection, setCurrentSection] = useState("basic");
  const router = useRouter();

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      title: initialData.title || "",
      make: initialData.make || "",
      model: initialData.model || "",
      year: initialData.year || "",
      price: initialData.price || "",
      mileage: initialData.mileage || "",
      bodyType: initialData.bodyType || "",
      fuelType: initialData.fuelType || "",
      transmission: initialData.transmission || "",
      color: initialData.color || "",
      seats: initialData.seats || "",
      location: initialData.location || "",
      features: initialData.features || [],
      description: initialData.description || "",
      status: initialData.status || "Available",
      featured: initialData.featured || false,
      images: initialData.images || [],
    },
    mode: "onChange",
  });

  const { data, loading, error, fn } = useFetch(addCar);

  const onSubmit = async (data) => {
    const response = await fn({ data });
    console.log("response", response);
    if (response?.success) {
      toast.success("Car added successfully");
      router.push("/admin/cars");
    } else {
      const errorMessage = response?.error || "Failed to add car";
      toast.error(errorMessage);
    }
  };

  const watchMake = watch("make");
  const watchModel = watch("model");
  const watchYear = watch("year");

  // Auto-generate title effect
  useEffect(() => {
    if (watchMake && watchModel && watchYear) {
      const generatedTitle = `${watchMake} ${watchModel} ${watchYear}`;
      setValue("title", generatedTitle, { shouldValidate: true });
    } else {
      setValue("title", "");
    }
  }, [watchMake, watchModel, watchYear, setValue]);

  // Update form when initialData changes (for AI mode)
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "price" && typeof value === "string") {
            // Remove $ and + symbols and convert to number
            const cleanPrice = value.replace(/[$,+]/g, "");
            const numPrice = parseFloat(cleanPrice);
            if (!isNaN(numPrice)) {
              setValue(key, numPrice);
            }
          } else if (key === "features" && typeof value === "string") {
            // Convert features string to array
            const featuresArray = value
              .split(",")
              .map((feature) => feature.trim())
              .filter(Boolean);
            setValue(key, featuresArray);
          } else {
            setValue(key, value);
          }
        }
      });
    }
  }, [initialData, setValue]);

  const formSections = [
    { id: "basic", label: "Basic Info" },
    { id: "specs", label: "Specifications" },
    { id: "details", label: "Additional Details" },
    { id: "status", label: "Status & Visibility" },
  ];

  const validateSection = async (sectionId) => {
    let isValid = true;

    if (sectionId === "basic") {
      const titleValue = getValues("title");
      if (!titleValue || titleValue.trim() === "") {
        setValue("title", "", { shouldValidate: true });
      }

      isValid = await trigger([
        "make",
        "model",
        "year",
        "title",
        "price",
        "mileage",
      ]);
    } else if (sectionId === "specs") {
      isValid = await trigger([
        "bodyType",
        "fuelType",
        "transmission",
        "color",
        "seats",
      ]);
    } else if (sectionId === "details") {
      isValid = await trigger(["description", "location", "images"]);
    }

    return isValid;
  };

  const handleNext = async () => {
    const currentIndex = formSections.findIndex((s) => s.id === currentSection);

    if (await validateSection(currentSection)) {
      if (currentIndex < formSections.length - 1) {
        setCurrentSection(formSections[currentIndex + 1].id);
      }
    } else {
      toast.error("Please complete all required fields", {
        description: "Fill in the highlighted fields to proceed",
        className: "text-sm",
      });
    }
  };
  const themeColors = isAIMode
    ? {
        stepActive: "bg-purple-600 text-white",
        stepInactive: "bg-gray-200 text-gray-600",
        stepLabelActive: "font-medium text-purple-600",
        stepLabelInactive: "text-gray-500",
        progressBar: "bg-purple-600",
        headerBg: "bg-gradient-to-r from-purple-50 to-purple-100",
        iconColor: "text-purple-600",
        buttonPrimary: "bg-purple-600 hover:bg-purple-700",
      }
    : {
        stepActive: "bg-blue-600 text-white",
        stepInactive: "bg-gray-200 text-gray-600",
        stepLabelActive: "font-medium text-blue-600",
        stepLabelInactive: "text-gray-500",
        progressBar: "bg-blue-600",
        headerBg: "bg-gradient-to-r from-blue-50 to-blue-100",
        iconColor: "text-blue-600",
        buttonPrimary: "bg-blue-600 hover:bg-blue-700",
      };

  return (
    <div className="w-full mx-auto px-0 sm:px-6">
      <div className="my-6 sm:my-8">
        <div className="hidden sm:flex justify-between">
          {formSections.map((section, index) => (
            <div key={section.id} className="flex flex-col items-center">
              {" "}
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2
                  ${
                    currentSection === section.id
                      ? themeColors.stepActive
                      : themeColors.stepInactive
                  }
                `}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs ${
                  currentSection === section.id
                    ? themeColors.stepLabelActive
                    : themeColors.stepLabelInactive
                }`}
              >
                {section.label}
              </span>
            </div>
          ))}
        </div>{" "}
        {/* Mobile section indicator */}
        <div className="sm:hidden flex items-center justify-center mb-4">
          <span className={`${themeColors.stepLabelActive}`}>
            {formSections.find((s) => s.id === currentSection)?.label}(
            {formSections.findIndex((s) => s.id === currentSection) + 1}/
            {formSections.length})
          </span>
        </div>
        <div className="w-full bg-gray-200 h-1 mt-2 sm:mt-4 rounded-full">
          <div
            className={`${themeColors.progressBar} h-1 rounded-full transition-all duration-300`}
            style={{
              width: `${
                (formSections.findIndex((s) => s.id === currentSection) /
                  (formSections.length - 1)) *
                100
              }%`,
            }}
          />
        </div>
      </div>{" "}
      <Card className="shadow-lg border-gray-200 py-0 gap-0">
        <CardHeader className={`${themeColors.headerBg} border-b py-3 sm:py-4`}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {isAIMode ? (
                  <Brain
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${themeColors.iconColor}`}
                  />
                ) : (
                  <Edit3
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${themeColors.iconColor}`}
                  />
                )}
                {isAIMode ? "AI-Extracted Car Information" : "Car Information"}
              </CardTitle>
              <CardDescription className="text-sm">
                {isAIMode
                  ? "Review and edit the AI-extracted details before submitting"
                  : "Enter all the details about the car you want to list"}
              </CardDescription>
              {isAIMode && aiConfidence && (
                <div className="mt-2">
                  <span className="text-xs text-gray-600">
                    AI Confidence:
                    <span
                      className={`ml-1 font-medium ${
                        aiConfidence > 0.8
                          ? "text-green-600"
                          : aiConfidence > 0.6
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {Math.round(aiConfidence * 100)}%
                    </span>
                  </span>
                </div>
              )}
            </div>

            {isAIMode && (
              <div className="flex items-center gap-3">
                {uploadedImage && (
                  <div className="flex items-center gap-2">
                    <img
                      src={URL.createObjectURL(uploadedImage)}
                      alt="Uploaded car"
                      className="w-12 h-12 object-cover rounded-md border"
                    />
                    <span className="text-xs text-gray-500">
                      Uploaded Image
                    </span>
                  </div>
                )}
                {onStartOver && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStartOver}
                    className="text-xs"
                  >
                    Start Over
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4 sm:p-4 pt-0 px-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 sm:space-y-8"
            noValidate
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentSection !== "status") {
                e.preventDefault();
                return false;
              }
            }}
          >
            <Toaster position="top-right" richColors />
            <div className="min-h-[400px] sm:min-h-0">
              {/* Basic Info Section */}
              {currentSection === "basic" && (
                <BasicInfoSection
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* Specifications Section */}
              {currentSection === "specs" && (
                <SpecificationsSection
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  trigger={trigger}
                  bodyTypes={bodyTypes}
                  fuelTypes={fuelTypes}
                  transmissions={transmissions}
                />
              )}

              {/* Additional Details Section */}
              {currentSection === "details" && (
                <DetailsSection
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {/* Status Section */}
              {currentSection === "status" && (
                <StatusSection
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  trigger={trigger}
                />
              )}
            </div>

            <div className="flex justify-between pt-4 sm:pt-6 border-t px-4 sm:px-0">
              <Button
                className="cursor-pointer text-sm sm:text-base px-3 sm:px-4 h-10"
                type="button"
                variant="outline"
                onClick={() => {
                  const currentIndex = formSections.findIndex(
                    (s) => s.id === currentSection
                  );
                  if (currentIndex > 0) {
                    setCurrentSection(formSections[currentIndex - 1].id);
                  }
                }}
                disabled={
                  formSections.findIndex((s) => s.id === currentSection) === 0
                }
              >
                Previous
              </Button>

              {currentSection !== formSections[formSections.length - 1].id ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  className={`cursor-pointer text-sm sm:text-base px-3 sm:px-4 h-10`}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={`${themeColors.buttonPrimary} text-sm sm:text-base px-3 sm:px-4 h-10`}
                  disabled={loading || Object.keys(errors).length > 0}
                >
                  {loading ? "Adding Car..." : "Add Car"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarFormShared;
