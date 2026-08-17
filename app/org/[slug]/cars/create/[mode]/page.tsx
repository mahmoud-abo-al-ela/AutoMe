"use client";

import React, { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import ManualCarForm from "../../_components/car-forms/manual/ManualCarForm";
import AICarForm from "../../_components/car-forms/ai/AICarForm";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getCarPlanLimits } from "@/actions/cars";

const readParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const CreateCarByModePage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = readParam(params.slug);
  // Anything that is not "manual" used to fall through to the AI form, which
  // also skipped the plan check below - only `mode === "ai"` ran it. The server
  // action stayed gated, so this was a UI-only bypass, but it offered the AI
  // uploader to plans that cannot use it.
  const rawMode = readParam(params.mode);
  const mode = rawMode === "ai" || rawMode === "manual" ? rawMode : null;
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode === "ai") {
      const checkAiAccess = async () => {
        try {
          const result = await getCarPlanLimits();
          if (result?.success) {
            setAiEnabled(result.data?.aiProcessingEnabled ?? false);
          } else {
            setAiEnabled(false);
          }
        } catch {
          setAiEnabled(false);
        }
      };
      checkAiAccess();
    }
  }, [mode]);

  const goBack = () => {
    router.back();
  };

  if (!mode) {
    notFound();
  }

  // If AI mode is selected but not enabled by plan, show upgrade message
  if (mode === "ai" && aiEnabled === false) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">AI-Powered Car Upload</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            AI Upload Requires a Paid Plan
          </h2>
          <p className="text-gray-500 max-w-md mb-6">
            Upgrade to the Pro or Enterprise plan to unlock AI-powered car
            uploads with automatic detail extraction, market price estimation,
            and feature recognition.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={goBack}>
              Go Back
            </Button>
            <Button
              onClick={() => router.push(`/org/${slug}/billing`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking AI access
  if (mode === "ai" && aiEnabled === null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">AI-Powered Car Upload</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === "manual" ? "Manual Car Entry" : "AI-Powered Car Upload"}
        </h1>
      </div>

      {mode === "manual" ? <ManualCarForm /> : <AICarForm />}
    </div>
  );
};

export default CreateCarByModePage;
