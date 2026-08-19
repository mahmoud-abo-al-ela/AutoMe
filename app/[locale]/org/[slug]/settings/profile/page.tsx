"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import OrganizationProfileForm from "./_components/OrganizationProfileForm";
import { useOrganizationProfile } from "./useOrganizationProfile";

export default function OrganizationProfileSettingsPage() {
  const {
    profile,
    loading,
    saving,
    countryOptions,
    stateOptions,
    cityOptions,
    selectedStateCode,
    loadingStates,
    loadingCities,
    updateField,
    handleCountryChange,
    handleStateChange,
    handleSubmit,
  } = useOrganizationProfile();

  return (
    <div className="p-4 sm:p-6">
      <Toaster richColors position="top-right" expand={true} />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Organization Profile
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage the public details customers see across dealership and car
          discovery pages.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <OrganizationProfileForm
              profile={profile}
              updateField={updateField}
              handleSubmit={handleSubmit}
              saving={saving}
              countryOptions={countryOptions}
              handleCountryChange={handleCountryChange}
              stateOptions={stateOptions}
              selectedStateCode={selectedStateCode}
              loadingStates={loadingStates}
              handleStateChange={handleStateChange}
              cityOptions={cityOptions}
              loadingCities={loadingCities}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
