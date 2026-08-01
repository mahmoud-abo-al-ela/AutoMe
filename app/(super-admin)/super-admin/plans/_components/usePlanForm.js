"use client";

import { useState, useEffect } from "react";

export const DEFAULT_FEATURES = {
  aiProcessing: { enabled: false },
  chat: false,
  prioritySupport: false,
  apiAccess: false,
  customBranding: false,
  dedicatedSupport: false,
};

const EMPTY_INPUTS = {
  monthlyPrice: "",
  yearlyPrice: "",
  maxCars: "",
  maxMembers: "",
  maxImagesPerCar: "",
  auditLogRetentionDays: "",
};

const EMPTY_FORM = {
  name: "",
  type: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  maxCars: 0,
  maxMembers: 0,
  maxImagesPerCar: 0,
  auditLogRetentionDays: null,
  features: DEFAULT_FEATURES,
};

/**
 * Form state for the plan create/edit dialog. Keeps a display-friendly
 * `inputValues` map separate from the numeric `formData` so number inputs don't
 * lose focus, and seeds both from the plan when editing.
 */
export function usePlanForm({ mode, plan, open }) {
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
        features: plan.features || DEFAULT_FEATURES,
      });
      setFeatures(plan.features || DEFAULT_FEATURES);
      setInputValues({
        monthlyPrice: plan.monthlyPrice ? (plan.monthlyPrice / 100).toString() : "",
        yearlyPrice: plan.yearlyPrice ? (plan.yearlyPrice / 100).toString() : "",
        maxCars: plan.maxCars === 0 ? "" : plan.maxCars.toString(),
        maxMembers: plan.maxMembers === 0 ? "" : plan.maxMembers.toString(),
        maxImagesPerCar: plan.maxImagesPerCar === 0 ? "" : plan.maxImagesPerCar.toString(),
        auditLogRetentionDays: plan.auditLogRetentionDays === null ? "" : plan.auditLogRetentionDays.toString(),
      });
    } else if (mode === "create") {
      setFormData(EMPTY_FORM);
      setFeatures(DEFAULT_FEATURES);
      setInputValues(EMPTY_INPUTS);
    }
  }, [mode, plan, open]);

  const handleFeatureChange = (key, value) => {
    const newFeatures = { ...features, [key]: value };
    setFeatures(newFeatures);
    setFormData({ ...formData, features: newFeatures });
  };

  // Merge the display inputs back into numeric form data for submission.
  const getSubmitData = () => ({
    ...formData,
    monthlyPrice: Math.round(parseFloat(inputValues.monthlyPrice) * 100) || 0,
    yearlyPrice: Math.round(parseFloat(inputValues.yearlyPrice) * 100) || 0,
    maxCars: inputValues.maxCars === "" ? 0 : parseInt(inputValues.maxCars),
    maxMembers: inputValues.maxMembers === "" ? 0 : parseInt(inputValues.maxMembers),
    maxImagesPerCar: inputValues.maxImagesPerCar === "" ? 0 : parseInt(inputValues.maxImagesPerCar),
    auditLogRetentionDays: inputValues.auditLogRetentionDays === "" ? null : parseInt(inputValues.auditLogRetentionDays),
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
