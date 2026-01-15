"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrganization } from "@/actions/onboarding";

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

  const updateDayHours = (day, field, value) => {
    updateFormData({
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const result = await createOrganization({
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        planId: formData.planId,
        workingHours: formData.workingHours,
        userId,
      });

      if (result.success) {
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
    <div className="space-y-6">
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
          const dayData = formData.workingHours[key];

          return (
            <div
              key={key}
              className="flex items-center gap-4 p-3 rounded-lg border bg-card"
            >
              <div className="w-28 font-medium">{label}</div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={!dayData.closed}
                  onCheckedChange={(checked) =>
                    updateDayHours(key, "closed", !checked)
                  }
                />
                <span className="text-sm text-muted-foreground w-14">
                  {dayData.closed ? "Closed" : "Open"}
                </span>
              </div>

              {!dayData.closed && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`${key}-open`}
                      className="text-sm text-muted-foreground"
                    >
                      From
                    </Label>
                    <Input
                      id={`${key}-open`}
                      type="time"
                      value={dayData.open}
                      onChange={(e) =>
                        updateDayHours(key, "open", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`${key}-close`}
                      className="text-sm text-muted-foreground"
                    >
                      To
                    </Label>
                    <Input
                      id={`${key}-close`}
                      type="time"
                      value={dayData.close}
                      onChange={(e) =>
                        updateDayHours(key, "close", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading}>
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
    </div>
  );
}
