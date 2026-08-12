"use client";

import type { CreateOrganizationSectionProps } from "./CreateOrganizationForm";
import { User, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OwnerSection({
  formData,
  onChange,
}: CreateOrganizationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Owner Assignment
        </CardTitle>
        <CardDescription>
          Optionally assign an owner to this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Owner Email (Optional)</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="owner@example.com"
              value={formData.ownerEmail}
              onChange={onChange}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            If this email matches an existing user, they will be assigned as the
            organization owner.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
