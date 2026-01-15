"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Building2, CheckCircle2, XCircle } from "lucide-react";
import { checkSlugAvailability } from "@/actions/onboarding";

export default function Step1OrgDetails({ formData, updateFormData, onNext }) {
  const [errors, setErrors] = useState({});
  const [slugStatus, setSlugStatus] = useState(null); // null, "checking", "available", "taken"
  const [slugCheckTimeout, setSlugCheckTimeout] = useState(null);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    updateFormData({ name, slug });
    
    // Debounce slug check
    if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
    if (slug.length >= 3) {
      setSlugStatus("checking");
      const timeout = setTimeout(async () => {
        const result = await checkSlugAvailability(slug);
        setSlugStatus(result.available ? "available" : "taken");
      }, 500);
      setSlugCheckTimeout(timeout);
    } else {
      setSlugStatus(null);
    }
  };

  const handleSlugChange = (e) => {
    const slug = generateSlug(e.target.value);
    updateFormData({ slug });
    
    // Debounce slug check
    if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
    if (slug.length >= 3) {
      setSlugStatus("checking");
      const timeout = setTimeout(async () => {
        const result = await checkSlugAvailability(slug);
        setSlugStatus(result.available ? "available" : "taken");
      }, 500);
      setSlugCheckTimeout(timeout);
    } else {
      setSlugStatus(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (formData.slug.length < 3) {
      newErrors.slug = "Slug must be at least 3 characters";
    } else if (slugStatus === "taken") {
      newErrors.slug = "This slug is already taken";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Dealership Name *</Label>
          <Input
            id="name"
            placeholder="Cairo Premium Cars"
            value={formData.name}
            onChange={handleNameChange}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <div className="relative">
            <Input
              id="slug"
              placeholder="cairo-premium-cars"
              value={formData.slug}
              onChange={handleSlugChange}
              className={`pr-10 ${errors.slug ? "border-destructive" : ""}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {slugStatus === "checking" && (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {slugStatus === "available" && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {slugStatus === "taken" && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your site will be at: <strong>{formData.slug || "your-slug"}.localhost:3000</strong>
          </p>
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Contact Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@yourdealership.com"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+20 123 456 7890"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="123 Main Street, Cairo, Egypt"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={slugStatus === "checking"}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
