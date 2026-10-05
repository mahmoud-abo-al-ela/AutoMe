"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("superAdmin.organizations.form.owner");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="ownerEmail">{t("email")}</Label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="owner@example.com"
              value={formData.ownerEmail}
              onChange={onChange}
              className="ps-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("help")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
