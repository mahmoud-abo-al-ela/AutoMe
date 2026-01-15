import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormSection from "../shared/FormSection";
import FieldInfo from "./FieldInfo";

const StatusSection = ({ register, errors, watch, setValue, trigger }) => {
  const watchStatus = watch("status");

  return (
    <FormSection title="Status & Visibility">
      <div className="space-y-2">
        <Label htmlFor="status" className="flex items-center">
          Status <FieldInfo text="Current availability of the vehicle" />
        </Label>
        <Select
          onValueChange={(value) => {
            setValue("status", value);
            if (errors.status) {
              trigger("status");
            }
          }}
          value={watchStatus || "Available"}
          defaultValue={watchStatus || "Available"}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status">
              {watchStatus || "Available"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
            <SelectItem value="Unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
        )}
      </div>

      <div className="flex items-start sm:items-center space-x-2 p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-100">
        <Checkbox
          id="featured"
          checked={watch("featured")}
          onCheckedChange={(checked) => {
            setValue("featured", checked || false);
            console.log("Featured value set to:", checked || false);
          }}
          className="mt-1 sm:mt-0"
        />
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="featured" className="font-medium">
            Feature this car on homepage
          </Label>
          <p className="text-xs sm:text-sm text-gray-500">
            Featured cars appear in the spotlight section
          </p>
          <p className="text-xs text-blue-600">
            Current value: {watch("featured") ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-md border border-green-100">
        <h4 className="text-green-700 font-medium flex items-center gap-1.5">
          <Check className="h-4 w-4" />
          Ready to submit
        </h4>
        <p className="text-xs sm:text-sm text-green-600 mt-1">
          All required information has been provided. You can now add this
          vehicle to your inventory.
        </p>
      </div>
    </FormSection>
  );
};

export default StatusSection;
