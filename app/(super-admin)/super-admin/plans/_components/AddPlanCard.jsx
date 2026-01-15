"use client";

import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AddPlanCard({ availableTypes, onClick }) {
  return (
    <Card
      className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[400px]"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center text-center p-6">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Add New Plan</h3>
        <p className="text-muted-foreground text-sm">
          {availableTypes.length > 0
            ? "Create a new pricing plan for your platform"
            : "All plan types already exist"}
        </p>
      </CardContent>
    </Card>
  );
}
