"use client";

import { useTranslations } from "next-intl";
import type { CreateOrganizationSectionProps } from "./CreateOrganizationForm";
import { Mail, Phone, Globe, MapPin } from "lucide-react";
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

export default function ContactInfoSection({
  formData,
  onChange,
}: CreateOrganizationSectionProps) {
  const t = useTranslations("superAdmin.organizations.form.contact");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@nile-motors.com"
              value={formData.email}
              onChange={onChange}
              className="ps-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <div className="relative">
            <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+20 10 1234 5678"
              value={formData.phone}
              onChange={onChange}
              className="ps-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t("website")}</Label>
          <div className="relative">
            <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://www.nile-motors.com"
              value={formData.website}
              onChange={onChange}
              className="ps-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t("address")}</Label>
          <div className="relative">
            <MapPin className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="address"
              name="address"
              placeholder={t("addressPlaceholder")}
              value={formData.address}
              onChange={onChange}
              className="ps-10"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
