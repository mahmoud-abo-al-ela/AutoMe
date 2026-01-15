"use client";

import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BasicInfoSection({ formData, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Enter the organization&apos;s basic details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Acme Auto Dealership"
            value={formData.name}
            onChange={onChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">https://</span>
            <Input
              id="slug"
              name="slug"
              placeholder="acme-auto"
              value={formData.slug}
              onChange={onChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">.autome.com</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-generated from name. Must be unique.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="A brief description of the organization..."
            value={formData.description}
            onChange={onChange}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
