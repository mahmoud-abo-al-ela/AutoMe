"use client";

import { Loader2 } from "lucide-react";
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
  loadingStates,
  handleStateChange,
  cityOptions,
  loadingCities,
}: OrganizationProfileFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profile.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={profile.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <SearchableLocationSelect
            id="country"
            value={profile.country || undefined}
            options={countryOptions}
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            emptyMessage="No countries found."
            onValueChange={handleCountryChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Governorate / State</Label>
          <SearchableLocationSelect
            id="region"
            value={selectedStateCode || undefined}
            options={stateOptions}
            placeholder={loadingStates ? "Loading states..." : "Select state"}
            searchPlaceholder="Search states..."
            emptyMessage="No states found."
            disabled={!profile.country || loadingStates || stateOptions.length === 0}
            onValueChange={handleStateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <SearchableLocationSelect
            id="city"
            value={profile.city || undefined}
            options={cityOptions}
            placeholder={loadingCities ? "Loading cities..." : "Select city"}
            searchPlaceholder="Search cities..."
            emptyMessage="No cities found."
            disabled={!selectedStateCode || loadingCities || cityOptions.length === 0}
            onValueChange={(city) => updateField("city", city)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={profile.address}
          onChange={(event) => updateField("address", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
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
            Saving...
          </span>
        ) : (
          "Save Profile"
        )}
      </Button>
    </form>
  );
}
