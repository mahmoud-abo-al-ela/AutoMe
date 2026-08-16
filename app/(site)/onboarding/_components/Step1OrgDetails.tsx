"use client";

import {
  FormFields,
  LocationFields,
  SlugPreview,
  OrgDetailsFooter,
  LogoUpload,
  useOrgDetails,
  getInputFields,
} from "./org-details";
import type {
  OnboardingFormData,
  UpdateFormData,
} from "../_lib/onboarding-types";

export default function Step1OrgDetails({
  formData,
  updateFormData,
  onNext,
}: {
  formData: OnboardingFormData;
  updateFormData: UpdateFormData;
  onNext: () => void;
}) {
  const {
    register,
    handleSubmit,
    errors,
    slugStatus,
    generatedSlug,
    onSubmit,
    isDisabled,
    watchedName,
    watchedEmail,
    watchedPhone,
    watchedAddress,
    location,
    updateLocation,
    logo,
    setLogo,
    logoError,
  } = useOrgDetails({ formData, updateFormData, onNext });

  const inputFields = getInputFields({
    name: watchedName,
    email: watchedEmail,
    phone: watchedPhone,
    address: watchedAddress,
  });

  const [nameField, emailField, phoneField, addressField] = inputFields;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* One grid for the whole step. Every control is 48px tall and every
          cell is half the width, so each row lines up with the one above it —
          the logo used to be a 112px tile in a flex row of its own, which left
          a block of empty space no other row had. */}
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <FormFields
          fields={[nameField]}
          register={register}
          errors={errors}
          bare
          footerSlot={<SlugPreview slug={generatedSlug} status={slugStatus} />}
        />
        <LogoUpload value={logo} onChange={setLogo} error={logoError} compact />

        <FormFields
          fields={[emailField, phoneField]}
          register={register}
          errors={errors}
          bare
        />
        <LocationFields value={location} onChange={updateLocation} />
        <FormFields
          fields={[addressField]}
          register={register}
          errors={errors}
          bare
        />
      </div>

      <OrgDetailsFooter
        disabled={isDisabled}
        hint={
          slugStatus === "checking"
            ? "Checking name availability…"
            : slugStatus === "taken"
              ? "Choose an available dealership name"
              : null
        }
      />
    </form>
  );
}
