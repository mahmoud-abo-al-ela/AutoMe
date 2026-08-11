"use client";

import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Plan } from "@/lib/generated/prisma";
import type { CreateOrganizationFormData } from "./CreateOrganizationForm";

/**
 * BUG (flagged, not fixed in this conversion): the feature list below reads
 * selectedPlan.maxStorageMB, and Plan has no such column — the schema has no
 * storage limit at all. React renders undefined as nothing, so that bullet has
 * always read "• MB storage". Dead UI rather than a crash.
 *
 * Typed as always-undefined so the dead read compiles unchanged and the defect
 * stays legible.
 */
type PlanWithMissingStorageLimit = Plan & { maxStorageMB?: undefined };

export default function PlanSection({
  formData,
  plans,
  onPlanChange,
}: {
  formData: CreateOrganizationFormData;
  plans: PlanWithMissingStorageLimit[];
  onPlanChange: (planId: string) => void;
}) {
  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Subscription Plan
        </CardTitle>
        <CardDescription>
          Select the subscription plan for this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planId">Plan *</Label>
            <Select value={formData.planId} onValueChange={onPlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-muted-foreground">
                        - ${(plan.monthlyPrice / 100).toFixed(0)}/mo
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  {selectedPlan.name} Plan Features:
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Up to {selectedPlan.maxCars} cars</li>
                  <li>• Up to {selectedPlan.maxMembers} team members</li>
                  <li>• {selectedPlan.maxImagesPerCar} images per car</li>
                  <li>• {selectedPlan.maxStorageMB}MB storage</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
