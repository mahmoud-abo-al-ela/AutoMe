"use client";

import React from "react";
import { useParams } from "next/navigation";
import ManualCarForm from "../../_components/car-forms/manual/ManualCarForm";
import AICarForm from "../../_components/car-forms/ai/AICarForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CreateCarByModePage = () => {
  const params = useParams();
  const router = useRouter();
  const { mode } = params;

  const goBack = () => {
    router.back();
  };

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
