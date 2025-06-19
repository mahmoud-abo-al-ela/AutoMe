import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import FormSection from "../shared/FormSection";
import FieldInfo from "../shared/FieldInfo";

const BasicInfoSection = ({ register, errors, watch, setValue }) => {
  return (
    <FormSection title="Basic Information">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make" className="flex items-center text-sm">
            Make <FieldInfo text="The manufacturer of the vehicle" />
          </Label>
          <Input
            type="text"
            id="make"
            placeholder="Tesla"
            {...register("make")}
            className={`${errors.make ? "border-red-500" : ""} text-sm`}
          />
          {errors.make && (
            <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className="flex items-center">
            Model <FieldInfo text="The model name of the vehicle" />
          </Label>
          <Input
            type="text"
            id="model"
            placeholder="Model 3"
            {...register("model")}
            className={`${errors.model ? "border-red-500" : ""}`}
          />
          {errors.model && (
            <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year" className="flex items-center">
            Year <FieldInfo text="Vehicle production year" />
          </Label>
          <Input
            type="number"
            id="year"
            placeholder="2023"
            {...register("year", { valueAsNumber: true })}
            className={`${errors.year ? "border-red-500" : ""}`}
          />
          {errors.year && (
            <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center">
            Title <FieldInfo text="Auto-generated from make, model and year" />
          </Label>
          <Input
            type="text"
            id="title"
            placeholder="Auto-generated when you enter make, model and year"
            value={watch("title") || ""}
            className="bg-gray-100"
            disabled
            readOnly
          />
          <input
            type="hidden"
            {...register("title", {
              required: "Title is required",
            })}
          />
          {watch("make") && watch("model") && watch("year") ? (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <Check className="h-3 w-3" /> Title generated successfully
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Complete make, model and year fields to generate title
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center">
            Price ($) <FieldInfo text="The listing price in USD" />
          </Label>
          <Input
            type="number"
            id="price"
            placeholder="48990"
            {...register("price", { valueAsNumber: true })}
            className={`${errors.price ? "border-red-500" : ""}`}
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">
            Mileage <FieldInfo text="The mileage of the vehicle" />
          </Label>
          <Input
            type="number"
            id="mileage"
            placeholder="1200"
            {...register("mileage", { valueAsNumber: true })}
            className={`${errors.mileage ? "border-red-500" : ""}`}
          />
          {errors.mileage && (
            <p className="text-red-500 text-sm mt-1">
              {errors.mileage.message}
            </p>
          )}
        </div>
      </div>
    </FormSection>
  );
};

export default BasicInfoSection;
