"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  Brain,
  CheckCircle,
  Edit3,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getCarPlanLimits } from "@/actions/cars";

type CarFormMode = "manual" | "ai";

const CreateCarForm = () => {
  const [selectedMode, setSelectedMode] = useState<CarFormMode | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { slug } = useParams();

  useEffect(() => {
    const fetchPlanLimits = async () => {
      try {
        const result = await getCarPlanLimits();
        if (result?.success) {
          setAiEnabled(result.data?.aiProcessingEnabled ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch plan limits:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanLimits();
  }, []);

  const handleModeSelect = (mode: CarFormMode) => {
    if (mode === "ai" && !aiEnabled) return;
    setSelectedMode(mode);
    router.push(`/org/${slug}/cars/create/${mode}`);
  };


  return (
    <div className="w-full max-w-6xl mx-auto sm:px-6 sm:py-8 md:py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
        Add a New Vehicle
      </h2>
      <p className="text-gray-500 text-center text-sm sm:text-base mb-6 sm:mb-8">
        Choose how you&apos;d like to add your vehicle details
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Manual Entry Option */}
        <div className="transform transition-transform duration-300 hover:scale-[1.02]">
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 overflow-hidden h-full py-0 sm:py-4 ${selectedMode === "manual"
              ? "border-blue-500 ring-2 ring-blue-300"
              : "hover:border-blue-500"
              }`}
            onClick={() => handleModeSelect("manual")}
          >
            <CardContent className="p-4 sm:p-6 md:p-8 text-center relative h-full flex flex-col">
              <div className="bg-blue-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-all duration-300 group-hover:bg-blue-100">
                <Edit3 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">
                Manual Entry
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                Fill in all car details manually using our comprehensive form.
                Perfect for when you have all the information ready.
              </p>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 mt-auto">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span>Complete control over details</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span>Custom pricing and features</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span>Quick and straightforward</span>
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 group cursor-pointer text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeSelect("manual");
                }}
              >
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Start Manual Entry
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Upload Option */}
        <div className={`transform transition-transform duration-300 ${aiEnabled ? "hover:scale-[1.02]" : "opacity-75"}`}>
          <Card
            className={`transition-all duration-300 border-2 overflow-hidden h-full py-0 sm:py-4 ${!aiEnabled
              ? "cursor-not-allowed border-gray-200 bg-gray-50"
              : selectedMode === "ai"
                ? "cursor-pointer hover:shadow-xl border-purple-500 ring-2 ring-purple-300"
                : "cursor-pointer hover:shadow-xl hover:border-purple-500"
              }`}
            onClick={() => handleModeSelect("ai")}
          >
            <CardContent className="p-4 sm:p-6 md:p-8 text-center relative h-full flex flex-col">
              {!aiEnabled && (
                <Badge
                  variant="secondary"
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-amber-100 text-amber-800 border-amber-200 text-xs"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Pro Plan
                </Badge>
              )}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ${aiEnabled
                ? "bg-gradient-to-br from-purple-50 to-indigo-50"
                : "bg-gray-100"
                }`}>
                <Brain className={`h-8 w-8 sm:h-10 sm:w-10 ${aiEnabled ? "text-purple-600" : "text-gray-400"}`} />
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-4 ${aiEnabled ? "text-gray-900" : "text-gray-500"}`}>
                AI Upload
              </h3>
              <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${aiEnabled ? "text-gray-600" : "text-gray-400"}`}>
                Upload car images and let our AI automatically extract all the
                details. Smart, fast, and accurate.
              </p>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-4 sm:mb-6 mt-auto">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${aiEnabled ? "text-purple-500" : "text-gray-300"}`} />
                  <span className={aiEnabled ? "text-gray-500" : "text-gray-400"}>Automatic detail extraction</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${aiEnabled ? "text-purple-500" : "text-gray-300"}`} />
                  <span className={aiEnabled ? "text-gray-500" : "text-gray-400"}>Market price estimation</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${aiEnabled ? "text-purple-500" : "text-gray-300"}`} />
                  <span className={aiEnabled ? "text-gray-500" : "text-gray-400"}>Feature recognition</span>
                </div>
              </div>
              {aiEnabled ? (
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 group cursor-pointer text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSelect("ai");
                  }}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Upload with AI
                  <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              ) : (
                <Button
                  className="w-full cursor-not-allowed text-xs sm:text-sm"
                  variant="secondary"
                  disabled
                  onClick={(e) => e.stopPropagation()}
                >
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Upgrade to Pro to Unlock
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateCarForm;
