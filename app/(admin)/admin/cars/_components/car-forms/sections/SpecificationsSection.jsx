import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormSection from "../shared/FormSection";
import FieldInfo from "./FieldInfo";

const SpecificationsSection = ({
  register,
  errors,
  watch,
  setValue,
  trigger,
  bodyTypes,
  fuelTypes,
  transmissions,
}) => {
  return (
    <FormSection title="Specifications">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 col-span-1 sm:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="bodyType" className="flex items-center">
              Body Type{" "}
              <FieldInfo text="The physical configuration of the vehicle" />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("bodyType", value, { shouldValidate: true });
                trigger("bodyType");
              }}
              defaultValue={watch("bodyType")}
            >
              <SelectTrigger
                id="bodyType"
                className={errors.bodyType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bodyType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.bodyType.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType" className="flex items-center">
              Fuel Type <FieldInfo text="The type of fuel the vehicle uses" />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("fuelType", value, { shouldValidate: true });
                trigger("fuelType");
              }}
              defaultValue={watch("fuelType")}
            >
              <SelectTrigger
                id="fuelType"
                className={errors.fuelType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fuelType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.fuelType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission" className="flex items-center">
              Transmission <FieldInfo text="The type of transmission system" />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("transmission", value, { shouldValidate: true });
                trigger("transmission");
              }}
              defaultValue={watch("transmission")}
            >
              <SelectTrigger
                id="transmission"
                className={errors.transmission ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select transmission" />
              </SelectTrigger>
              <SelectContent>
                {transmissions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transmission && (
              <p className="text-red-500 text-sm mt-1">
                {errors.transmission.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats" className="flex items-center">
              Seats <FieldInfo text="Number of seats in the vehicle" />
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("seats", parseInt(value), { shouldValidate: true });
                trigger("seats");
              }}
              defaultValue={watch("seats")?.toString()}
            >
              <SelectTrigger
                id="seats"
                className={errors.seats ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select number of seats" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "seat" : "seats"}
                  </SelectItem>
                ))}
                <SelectItem value="6"> More than 5 seats</SelectItem>
              </SelectContent>
            </Select>
            {errors.seats && (
              <p className="text-red-500 text-sm mt-1">
                {errors.seats.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color" className="flex items-center">
          Color <FieldInfo text="The exterior color of the vehicle" />
        </Label>
        <Input
          type="text"
          id="color"
          placeholder="e.g., Silver, Black, Red"
          {...register("color")}
          className={errors.color ? "border-red-500" : ""}
        />
        {errors.color && (
          <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="features" className="flex items-center">
          Features <FieldInfo text="List major features separated by commas" />
        </Label>
        <Textarea
          id="features"
          placeholder="Electric, Autopilot, Long Range, Premium Interior"
          className={`min-h-[80px] ${errors.features ? "border-red-500" : ""}`}
          {...register("features")}
        />
        {errors.features && (
          <p className="text-red-500 text-sm mt-1">{errors.features.message}</p>
        )}
        {watch("features") && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(Array.isArray(watch("features"))
              ? watch("features")
              : watch("features").split(",")
            ).map((feature, idx) =>
              feature.trim() ? (
                <Badge key={idx} variant="secondary" className="bg-blue-50">
                  {feature.trim()}
                </Badge>
              ) : null
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
};

export default SpecificationsSection;
