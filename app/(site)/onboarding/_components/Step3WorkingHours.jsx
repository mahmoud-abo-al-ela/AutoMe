"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrganization } from "@/actions/onboarding";
import { workingHoursSchema } from "./schemas";

const days = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function Step3WorkingHours({
  formData,
  updateFormData,
  onNext,
  onPrev,
  setCreatedOrg,
  userId,
}) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workingHoursSchema),
    mode: "onChange",
    defaultValues: {
      workingHours: formData.workingHours,
    },
  });

  const workingHours = watch("workingHours");

  const updateDayHours = (day, field, value) => {
    setValue(`workingHours.${day}.${field}`, value, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await createOrganization({
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        planId: formData.planId,
        workingHours: data.workingHours,
        userId,
      });

      if (result.success) {
        updateFormData(data);
        setCreatedOrg(result.organization);
        onNext();
      } else {
        toast.error(result.error || "Failed to create organization");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Working Hours</h2>
          <p className="text-sm text-muted-foreground">
            Set your dealership's opening hours
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {days.map(({ key, label }) => {
          const dayData = workingHours[key];

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between sm:justify-start sm:w-28">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2 sm:hidden">
                  <Controller
                    name={`workingHours.${key}.closed`}
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={!field.value}
                        onCheckedChange={(checked) => field.onChange(!checked)}
                      />
                    )}
                  />
                  <span className="text-sm text-muted-foreground w-14">
                    {dayData.closed ? "Closed" : "Open"}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Controller
                  name={`workingHours.${key}.closed`}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={!field.value}
                      onCheckedChange={(checked) => field.onChange(!checked)}
                      className="cursor-pointer"
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground w-14">
                  {dayData.closed ? "Closed" : "Open"}
                </span>
              </div>

              {!dayData.closed && (
                <div className="flex items-center text-end gap-3 flex-1">
                  <div className="flex items-center justify-end gap-2 flex-1">
                    <Label
                      htmlFor={`${key}-open`}
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      From
                    </Label>
                    <Controller
                      name={`workingHours.${key}.open`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`${key}-open`}
                          type="time"
                          {...field}
                          className="w-full sm:w-32"
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Label
                      htmlFor={`${key}-close`}
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      To
                    </Label>
                    <Controller
                      name={`workingHours.${key}.close`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`${key}-close`}
                          type="time"
                          {...field}
                          className="w-full sm:w-32"
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrev} disabled={loading} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={loading} className="cursor-pointer">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Dealership"
          )}
        </Button>
      </div>
    </form>
  );
}
