"use client";

import { useTranslations } from "next-intl";
import type { CreateOrganizationSectionProps } from "./CreateOrganizationForm";
import { ROOT_DOMAIN } from "@/lib/utils/tenant-host";
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

export default function BasicInfoSection({
  formData,
  onChange,
}: CreateOrganizationSectionProps) {
  const t = useTranslations("superAdmin.organizations.form.basic");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            name="name"
            placeholder={t("namePlaceholder")}
            value={formData.name}
            onChange={onChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">{t("slug")}</Label>
          {/* A URL reads left to right in either language; laid out RTL the
              scheme would land after the domain. */}
          <div dir="ltr" className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">https://</span>
            <Input
              id="slug"
              name="slug"
              placeholder="nile-motors"
              value={formData.slug}
              onChange={onChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">.{ROOT_DOMAIN}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={t("descriptionPlaceholder")}
            value={formData.description}
            onChange={onChange}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
