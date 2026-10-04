"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dispatch, SetStateAction } from "react";
import type { PlanType } from "@/lib/generated/prisma";
import {
  parseAiLimit,
  type PlanFeatures,
  type PlanFormInputValues,
  type PlanFormState,
} from "./usePlanForm";

// The three-tab body (Basic / Limits / Features) of the plan form dialog.
export default function PlanFormTabs({
  mode,
  availableTypes,
  formData,
  setFormData,
  inputValues,
  setInputValues,
  features,
  handleFeatureChange,
}: {
  mode: "create" | "edit";
  availableTypes: PlanType[];
  formData: PlanFormState;
  setFormData: Dispatch<SetStateAction<PlanFormState>>;
  inputValues: PlanFormInputValues;
  setInputValues: Dispatch<SetStateAction<PlanFormInputValues>>;
  features: PlanFeatures;
  handleFeatureChange: <K extends keyof PlanFeatures>(
    key: K,
    value: PlanFeatures[K]
  ) => void;
}) {
  const t = useTranslations("superAdmin.plans.form");
  const tPlans = useTranslations("plans.plans");
  const typeLabel = (type: PlanType) => {
    const key = planKeyFor(type);
    return key ? tPlans(`${key}.name`) : type;
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">{t("tabs.basic")}</TabsTrigger>
        <TabsTrigger value="limits">{t("tabs.limits")}</TabsTrigger>
        <TabsTrigger value="features">{t("tabs.features")}</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            placeholder={t("namePlaceholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {mode === "create" && (
          <div className="grid gap-2">
            <Label htmlFor="type">{t("type")}</Label>
            {/* Radix Select hands back a plain string; the only items rendered
                below are availableTypes, so the value is always a PlanType. */}
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as PlanType })}>
              <SelectTrigger id="type">
                <SelectValue placeholder={t("typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="monthlyPrice">{t("monthlyPrice")}</Label>
            <Input
              id="monthlyPrice"
              type="number"
              step="0.01"
              placeholder="e.g., 29.00"
              value={inputValues.monthlyPrice}
              onChange={(e) => setInputValues({ ...inputValues, monthlyPrice: e.target.value })}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, monthlyPrice: Math.round(value * 100) });
                setInputValues({ ...inputValues, monthlyPrice: value.toString() });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="yearlyPrice">{t("yearlyPrice")}</Label>
            <Input
              id="yearlyPrice"
              type="number"
              step="0.01"
              placeholder="e.g., 290.00"
              value={inputValues.yearlyPrice}
              onChange={(e) => setInputValues({ ...inputValues, yearlyPrice: e.target.value })}
              onBlur={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, yearlyPrice: Math.round(value * 100) });
                setInputValues({ ...inputValues, yearlyPrice: value.toString() });
              }}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="limits" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="maxCars">{t("maxCars")}</Label>
            <Input
              id="maxCars"
              type="number"
              value={inputValues.maxCars}
              onChange={(e) => setInputValues({ ...inputValues, maxCars: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                setFormData({ ...formData, maxCars: isNaN(value) ? 0 : value });
                setInputValues({ ...inputValues, maxCars: value === 0 ? "" : value.toString() });
              }}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxMembers">{t("maxMembers")}</Label>
            <Input
              id="maxMembers"
              type="number"
              value={inputValues.maxMembers}
              onChange={(e) => setInputValues({ ...inputValues, maxMembers: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                setFormData({ ...formData, maxMembers: isNaN(value) ? 0 : value });
                setInputValues({ ...inputValues, maxMembers: value === 0 ? "" : value.toString() });
              }}
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="maxImagesPerCar">{t("maxImages")}</Label>
            <Input
              id="maxImagesPerCar"
              type="number"
              value={inputValues.maxImagesPerCar}
              onChange={(e) => setInputValues({ ...inputValues, maxImagesPerCar: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                setFormData({ ...formData, maxImagesPerCar: isNaN(value) ? 0 : value });
                setInputValues({ ...inputValues, maxImagesPerCar: value === 0 ? "" : value.toString() });
              }}
              placeholder="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auditLogRetentionDays">{t("retention")}</Label>
            <Input
              id="auditLogRetentionDays"
              type="number"
              placeholder={t("retentionPlaceholder")}
              value={inputValues.auditLogRetentionDays}
              onChange={(e) => setInputValues({ ...inputValues, auditLogRetentionDays: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value === "" ? null : parseInt(e.target.value);
                setFormData({ ...formData, auditLogRetentionDays: value === null || isNaN(value) ? null : value });
                setInputValues({ ...inputValues, auditLogRetentionDays: value === null ? "" : value.toString() });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trialDays">{t("trialDays")}</Label>
            <Input
              id="trialDays"
              type="number"
              min={0}
              placeholder={t("trialPlaceholder")}
              value={inputValues.trialDays}
              onChange={(e) => setInputValues({ ...inputValues, trialDays: e.target.value })}
              onBlur={(e) => {
                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                const safe = isNaN(value) || value < 0 ? 0 : value;
                setFormData({ ...formData, trialDays: safe });
                setInputValues({ ...inputValues, trialDays: safe === 0 ? "" : safe.toString() });
              }}
            />
            <p className="text-xs text-muted-foreground">{t("trialHelp")}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="features" className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="aiProcessing"
              checked={features.aiProcessing?.enabled || false}
              // Radix's CheckedState is boolean | "indeterminate". None of
              // these checkboxes is ever indeterminate, so the stored value is
              // a boolean; cast rather than coerce, to keep behaviour identical.
              // Spread, not replace: `{ enabled }` alone used to drop the limit,
              // and a missing limit is enforced as 0.
              onCheckedChange={(checked) =>
                handleFeatureChange("aiProcessing", { ...features.aiProcessing, enabled: checked as boolean })
              }
            />
            <Label htmlFor="aiProcessing" className="cursor-pointer">{t("aiProcessing")}</Label>
          </div>
          {features.aiProcessing?.enabled && (
            <div className="grid gap-2 ps-6">
              <Label htmlFor="aiProcessingLimit">{t("aiLimit")}</Label>
              <Input
                id="aiProcessingLimit"
                type="number"
                min={-1}
                placeholder="0"
                value={inputValues.aiProcessingLimit}
                onChange={(e) => setInputValues({ ...inputValues, aiProcessingLimit: e.target.value })}
              />
              {parseAiLimit(inputValues.aiProcessingLimit) === 0 && (
                <p className="text-xs text-destructive">{t("aiLimitZero")}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="aiAssistant"
              checked={features.aiAssistant?.enabled || false}
              onCheckedChange={(checked) =>
                handleFeatureChange("aiAssistant", { ...features.aiAssistant, enabled: checked as boolean })
              }
            />
            <Label htmlFor="aiAssistant" className="cursor-pointer">{t("aiAssistant")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="chat"
              checked={features.chat || false}
              onCheckedChange={(checked) => handleFeatureChange("chat", checked as boolean)}
            />
            <Label htmlFor="chat" className="cursor-pointer">{t("chat")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="prioritySupport"
              checked={features.prioritySupport || false}
              onCheckedChange={(checked) => handleFeatureChange("prioritySupport", checked as boolean)}
            />
            <Label htmlFor="prioritySupport" className="cursor-pointer">{t("prioritySupport")}</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
