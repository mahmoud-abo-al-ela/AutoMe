"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { checkSlugAvailability } from "@/actions/onboarding";
import { orgDetailsSchema } from "./schemas";

export default function Step1OrgDetails({ formData, updateFormData, onNext }) {
  const [slugStatus, setSlugStatus] = useState(null); // null, "checking", "available", "taken"
  const [generatedSlug, setGeneratedSlug] = useState("");
  const [slugCheckTimeout, setSlugCheckTimeout] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(orgDetailsSchema),
    mode: "onChange",
    defaultValues: {
      name: formData.name || "",
      email: formData.email || "",
      phone: formData.phone || "",
      address: formData.address || "",
    },
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedPhone = watch("phone")
  const watchAedddress = watch("address")
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  // Auto-generate slug from name and check availability
  useEffect(() => {
    if (slugCheckTimeout) clearTimeout(slugCheckTimeout);

    if (watchedName && watchedName.length >= 3) {
      const slug = generateSlug(watchedName);
      setGeneratedSlug(slug);
      setSlugStatus("checking");

      const timeout = setTimeout(async () => {
        const result = await checkSlugAvailability(slug);
        setSlugStatus(result.available ? "available" : "taken");
      }, 500);
      setSlugCheckTimeout(timeout);
    } else {
      setGeneratedSlug("");
      setSlugStatus(null);
    }

    return () => {
      if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
    };
  }, [watchedName]);

  const onSubmit = (data) => {
    if (slugStatus === "taken" || !generatedSlug) {
      return;
    }
    // Add the auto-generated slug to the form data
    updateFormData({ ...data, slug: generatedSlug });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Organization Details</h2>
          <p className="text-sm text-muted-foreground">
            Tell us about your dealership
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Dealership Name <span className="text-destructive"> * </span></Label>
          <Input
            id="name"
            placeholder="Cairo Premium Cars"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
          {slugStatus === "taken" && (
            <p className="text-sm text-destructive">
              This name is already taken. Please choose a different name.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Contact Email <span className="text-destructive"> * </span></Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@yourdealership.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number <span className="text-destructive"> * </span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+20 123 456 7890"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address <span className="text-destructive"> * </span></Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street, Cairo, Egypt"
            {...register("address")}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={
            slugStatus === "checking" ||
            slugStatus === "taken" ||
            !generatedSlug ||
            !watchedName?.trim() ||
            !watchedEmail?.trim() ||
            !watchedPhone?.trim() ||
            !watchAedddress?.trim()
          }
          data-continue-btn
          className="cursor-pointer"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
