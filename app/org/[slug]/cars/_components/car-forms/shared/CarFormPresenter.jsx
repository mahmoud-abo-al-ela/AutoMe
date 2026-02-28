import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Edit3, Brain } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import {
    BasicInfoSection,
    SpecificationsSection,
    DetailsSection,
    StatusSection,
} from "../sections";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/car-options";

const getThemeColors = (isAIMode) => {
    return isAIMode
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
};

export const CarFormPresenter = ({
    form,
    currentSection,
    formSections,
    loading,
    isAIMode = false,
    onStartOver = null,
    aiConfidence = null,
    uploadedImage = null,
    handlers,
    maxImages = 5,
}) => {
    const themeColors = getThemeColors(isAIMode);
    const { register, formState: { errors }, watch, setValue, trigger } = form;

    return (
        <div className="w-full mx-auto px-0 sm:px-6">
            {/* Progress Steps */}
            <div className="my-6 sm:my-8">
                <div className="hidden sm:flex justify-between">
                    {formSections.map((section, index) => (
                        <div key={section.id} className="flex flex-col items-center">
                            <div
                                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2
                  ${currentSection === section.id
                                        ? themeColors.stepActive
                                        : themeColors.stepInactive
                                    }
                `}
                            >
                                {index + 1}
                            </div>
                            <span
                                className={`text-xs ${currentSection === section.id
                                        ? themeColors.stepLabelActive
                                        : themeColors.stepLabelInactive
                                    }`}
                            >
                                {section.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Mobile section indicator */}
                <div className="sm:hidden flex items-center justify-center mb-4">
                    <span className={`${themeColors.stepLabelActive}`}>
                        {formSections.find((s) => s.id === currentSection)?.label} (
                        {formSections.findIndex((s) => s.id === currentSection) + 1}/
                        {formSections.length})
                    </span>
                </div>

                <div className="w-full bg-gray-200 h-1 mt-2 sm:mt-4 rounded-full">
                    <div
                        className={`${themeColors.progressBar} h-1 rounded-full transition-all duration-300`}
                        style={{
                            width: `${(formSections.findIndex((s) => s.id === currentSection) /
                                    (formSections.length - 1)) *
                                100
                                }%`,
                        }}
                    />
                </div>
            </div>

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
                                            className={`ml-1 font-medium ${aiConfidence > 0.8
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
                        onSubmit={form.handleSubmit(handlers.onSubmit)}
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
                            {currentSection === "basic" && (
                                <BasicInfoSection
                                    register={register}
                                    errors={errors}
                                    watch={watch}
                                    setValue={setValue}
                                />
                            )}

                            {currentSection === "specs" && (
                                <SpecificationsSection
                                    register={register}
                                    errors={errors}
                                    watch={watch}
                                    setValue={setValue}
                                    trigger={trigger}
                                    bodyTypes={BODY_TYPES}
                                    fuelTypes={FUEL_TYPES}
                                    transmissions={TRANSMISSIONS}
                                />
                            )}

                            {currentSection === "details" && (
                                <DetailsSection
                                    register={register}
                                    errors={errors}
                                    watch={watch}
                                    setValue={setValue}
                                    maxImages={maxImages}
                                />
                            )}

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
                                onClick={handlers.handlePrevious}
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
                                        handlers.handleNext();
                                    }}
                                    className="cursor-pointer text-sm sm:text-base px-3 sm:px-4 h-10"
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
