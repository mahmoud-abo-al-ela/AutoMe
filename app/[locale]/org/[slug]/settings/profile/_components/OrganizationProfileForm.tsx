"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import type { useOrganizationProfile } from "../useOrganizationProfile";

// The page spreads the hook's result straight in, so deriving the props keeps
// the two from drifting.
type OrganizationProfileFormProps = Omit<
  ReturnType<typeof useOrganizationProfile>,
  "loading"
>;

export default function OrganizationProfileForm({
  profile,
  updateField,
  handleSubmit,
  saving,
  countryOptions,
  handleCountryChange,
  stateOptions,
  selectedStateCode,
  handleStateChange,
  cityOptions,
}: OrganizationProfileFormProps) {
  const t = useTranslations("org.settings.profile");
  // The field and location labels are the onboarding wizard's — the dealer
  // filled these in there first, and editing them here should read the same.
  const tFields = useTranslations("onboarding.orgDetails.fields");
  const tLocation = useTranslations("onboarding.orgDetails.location");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{tFields("name.label")}</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{tFields("email.label")}</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{tFields("phone.label")}</Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">{t("website")}</Label>
          <Input
            id="website"
            value={profile.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{tLocation("country.label")}</Label>
          <SearchableLocationSelect
            id="country"
            value={profile.country || undefined}
            options={countryOptions}
            placeholder={tLocation("country.placeholder")}
            searchPlaceholder={tLocation("country.searchPlaceholder")}
            emptyMessage={tLocation("country.emptyMessage")}
            onValueChange={handleCountryChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">{tLocation("region.label")}</Label>
          <SearchableLocationSelect
            id="region"
            value={selectedStateCode || undefined}
            options={stateOptions}
            placeholder={tLocation("region.placeholder")}
            searchPlaceholder={tLocation("region.searchPlaceholder")}
            emptyMessage={tLocation("region.emptyMessage")}
            disabled={!profile.country || stateOptions.length === 0}
            onValueChange={handleStateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{tLocation("city.label")}</Label>
          <SearchableLocationSelect
            id="city"
            value={profile.city || undefined}
            options={cityOptions}
            placeholder={tLocation("city.placeholder")}
            searchPlaceholder={tLocation("city.searchPlaceholder")}
            emptyMessage={tLocation("city.emptyMessage")}
            disabled={!selectedStateCode || cityOptions.length === 0}
            onValueChange={(city) => updateField("city", city)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{tFields("address.label")}</Label>
        <Input
          id="address"
          value={profile.address}
          onChange={(event) => updateField("address", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          value={profile.description}
          onChange={(event) => updateField("description", event.target.value)}
          rows={5}
        />
      </div>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <span className="flex items-center">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </span>
        ) : (
          t("save")
        )}
      </Button>
    </form>
  );
}
