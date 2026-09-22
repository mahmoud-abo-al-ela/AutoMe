"use client";

import { useState, useEffect } from "react";
import type { Plan, PlanType } from "@/lib/generated/prisma";
import type { PlanFormInput } from "@/lib/services/super-admin/plan";

/** The feature flags stored in Plan.features (a Json column). */
export type PlanFeatures = {
  aiProcessing: { enabled: boolean };
  chat: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  dedicatedSupport: boolean;
};

/**
 * Numeric form state. Prices are held in minor units here, matching
 * Plan.monthlyPrice/yearlyPrice; inputValues below carries the major-unit
 * strings the user actually types. `type` allows "" for the not-yet-chosen
 * state on the create path.
 */
export type PlanFormState = {
  name: string;
  type: PlanType | "";
  monthlyPrice: number;
  yearlyPrice: number;
  maxCars: number;
  maxMembers: number;
  maxImagesPerCar: number;
  auditLogRetentionDays: number | null;
  /** Free trial length for subscribers on this plan; 0 means no trial. */
  trialDays: number;
  features: PlanFeatures;
};

/**
 * What the form hands back on submit. Identical to the action's PlanFormInput
 * except that `type` may still be "": the create dialog lets you submit before
 * choosing one, and PlansGrid.handleCreate is what rejects it.
 */
export type PlanFormSubmitData = Omit<PlanFormInput, "type"> & {
  type: PlanType | "";
};

/** The display strings bound to the number inputs, kept separate so that
 * partially-typed values do not round-trip through Number and lose focus. */
export type PlanFormInputValues = {
  monthlyPrice: string;
  yearlyPrice: string;
  maxCars: string;
  maxMembers: string;
  maxImagesPerCar: string;
  auditLogRetentionDays: string;
  trialDays: string;
};

export const DEFAULT_FEATURES: PlanFeatures = {
  aiProcessing: { enabled: false },
  chat: false,
  prioritySupport: false,
  apiAccess: false,
  customBranding: false,
  dedicatedSupport: false,
};

const EMPTY_INPUTS: PlanFormInputValues = {
  monthlyPrice: "",
  yearlyPrice: "",
  maxCars: "",
  maxMembers: "",
  maxImagesPerCar: "",
  auditLogRetentionDays: "",
  trialDays: "",
};

const EMPTY_FORM: PlanFormState = {
  name: "",
  type: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  maxCars: 0,
  maxMembers: 0,
  maxImagesPerCar: 0,
  auditLogRetentionDays: null,
  trialDays: 0,
  features: DEFAULT_FEATURES,
};

/**
 * Form state for the plan create/edit dialog. Keeps a display-friendly
 * `inputValues` map separate from the numeric `formData` so number inputs don't
 * lose focus, and seeds both from the plan when editing.
 */
export function usePlanForm({
  mode,
  plan,
  open,
}: {
  mode: "create" | "edit";
  plan: Plan | null;
  open: boolean;
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [inputValues, setInputValues] = useState(EMPTY_INPUTS);

  useEffect(() => {
    if (mode === "edit" && plan) {
      setFormData({
        name: plan.name || "",
        type: plan.type || "",
        monthlyPrice: plan.monthlyPrice || 0,
        yearlyPrice: plan.yearlyPrice || 0,
        maxCars: plan.maxCars || 0,
        maxMembers: plan.maxMembers || 0,
        maxImagesPerCar: plan.maxImagesPerCar || 0,
        auditLogRetentionDays: plan.auditLogRetentionDays,
        trialDays: plan.trialDays ?? 0,
        // Plan.features is a Json column, so Prisma types it as JsonValue.
        // The shape is only ever written by this form.
        features: (plan.features as PlanFeatures | null) || DEFAULT_FEATURES,
      });
      setFeatures((plan.features as PlanFeatures | null) || DEFAULT_FEATURES);
      setInputValues({
        monthlyPrice: plan.monthlyPrice ? (plan.monthlyPrice / 100).toString() : "",
        yearlyPrice: plan.yearlyPrice ? (plan.yearlyPrice / 100).toString() : "",
        maxCars: plan.maxCars === 0 ? "" : plan.maxCars.toString(),
        maxMembers: plan.maxMembers === 0 ? "" : plan.maxMembers.toString(),
        maxImagesPerCar: plan.maxImagesPerCar === 0 ? "" : plan.maxImagesPerCar.toString(),
        auditLogRetentionDays: plan.auditLogRetentionDays === null ? "" : plan.auditLogRetentionDays.toString(),
        trialDays: !plan.trialDays ? "" : plan.trialDays.toString(),
      });
    } else if (mode === "create") {
      setFormData(EMPTY_FORM);
      setFeatures(DEFAULT_FEATURES);
      setInputValues(EMPTY_INPUTS);
    }
  }, [mode, plan, open]);

  const handleFeatureChange = <K extends keyof PlanFeatures>(
    key: K,
    value: PlanFeatures[K]
  ) => {
    const newFeatures: PlanFeatures = { ...features, [key]: value };
    setFeatures(newFeatures);
    setFormData({ ...formData, features: newFeatures });
  };

  // Merge the display inputs back into numeric form data for submission.
  // Prices are converted from major units back to minor units here.
  const getSubmitData = (): PlanFormSubmitData => ({
    ...formData,
    monthlyPrice: Math.round(parseFloat(inputValues.monthlyPrice) * 100) || 0,
    yearlyPrice: Math.round(parseFloat(inputValues.yearlyPrice) * 100) || 0,
    maxCars: inputValues.maxCars === "" ? 0 : parseInt(inputValues.maxCars),
    maxMembers: inputValues.maxMembers === "" ? 0 : parseInt(inputValues.maxMembers),
    maxImagesPerCar: inputValues.maxImagesPerCar === "" ? 0 : parseInt(inputValues.maxImagesPerCar),
    auditLogRetentionDays: inputValues.auditLogRetentionDays === "" ? null : parseInt(inputValues.auditLogRetentionDays),
    trialDays: inputValues.trialDays === "" ? 0 : parseInt(inputValues.trialDays),
  });

  return {
    formData,
    setFormData,
    inputValues,
    setInputValues,
    features,
    handleFeatureChange,
    getSubmitData,
  };
}
